import * as memoryjs from 'memoryjs';
import { Subscription } from 'rxjs';

import * as fs from 'fs';
import * as path from 'path';

import type { ListedProcess } from 'memoryjs';
import { EmulatorState, EmulatorVersion } from 'common/states/EmulatorState';
import { MemoryWatcher } from './MemoryWatcher';
import { SettingsManager } from './SettingsManager';

export const patchesRoot = './patches';

export interface ProcessReadWrite {
  readMemory: (offset: number, length: number) => Buffer | number;
  writeMemory: (offset: number, buffer: Buffer) => void;
}

/**
 * Information regarding the format of the patch files.
 */
interface PatchMetadata {
  /** Human readable list of preconditions for this patch to be applied. */
  requirements: string[];
  /** Byte order format of the patch files. Specified if a byte swap should be applied before patching. */
  byteOrder?: undefined | '16' | '32' | '64';
}

/**
 * An Emulator object represents the connection
 * to the loaded emulator.
 */
export class Emulator {
  public baseAddress: number;
  public isAutoPatchingEnabled = true;
  public isRestoringFileAFlagsEnabled = false;
  public isSkipIntroEnabled = true;

  public processId: number;
  public emulatorVersion: EmulatorVersion;

  private processReadWrite: ProcessReadWrite;

  private state = EmulatorState.NOT_CONNECTED;
  
  private settingsManager: SettingsManager;

  private subscriptions: {
    /** VI timer */
    time?: Subscription;
    /** File A flags */
    fileAFlags?: Subscription;
    /** Implementation of the death timer GS code */
    deathTimerFix?: Subscription;
  } = {};

  public getState(): EmulatorState {
    return this.state;
  }

  /**
   * A list of available Processes.
   * 
   * @param {RegExp} [processName] - Filter the results with a regular expression.
   */
  public static getAllProcesses(processName?: RegExp): ListedProcess[] {
    if (processName) {
      return memoryjs.getProcesses().filter((process) => {
        return process.szExeFile.match(processName);
      });
    } else {
      return memoryjs.getProcesses();
    }
  }

  /**
   * Emulator constructor.
   *
   * @param {number} processId - Process ID to load
   */
  constructor(processId: number, settingsManager: SettingsManager) {
    this.state = EmulatorState.CONNECTING;
    console.log('Emulator constructor called with processId:', processId);
    try {
      memoryjs.openProcess(processId);
      this.processId = processId;
    } catch (error) {
      console.log('error opening process with id', processId);
      throw error;
    }
    const processObject = memoryjs.openProcess(processId);
    console.log('Process loaded successfully');
    this.processReadWrite = {
      readMemory: (offset: number, length: number): number | Buffer =>
        memoryjs.readBuffer(processObject.handle, offset, length),
      writeMemory: (offset: number, buffer: Buffer): void => memoryjs.writeBuffer(processObject.handle, offset, buffer),
    };
    console.log('Looking up base address');
    this.baseAddress = -1;
    for (let i = 0x00000000; i <= 0xffffffff; i += 0x1000) {
      const buf1 = this.processReadWrite.readMemory(i, 4);
      if (typeof buf1 !== 'object') continue;
      const val1 = buf1.readUInt32LE(0);
      if (val1 !== 0x3c1a8032) continue;
      const buf2 = this.processReadWrite.readMemory(i + 4, 4);
      if (typeof buf2 !== 'object') continue;
      const val2 = buf2.readUInt32LE(0);
      if (val2 !== 0x275a7650) continue;
      this.baseAddress = i;
    }

    console.log('Base address:', this.baseAddress.toString(16));
    if (this.baseAddress === -1) {
      throw new Error('Could not find base address');
    }

    if (processObject.modBaseAddr === 4194304) {
      this.emulatorVersion = EmulatorVersion.VERSION_1_6;
    } else if (this.baseAddress === 0x52b40000) {
      this.emulatorVersion = EmulatorVersion.VERSION_2_2_MM;
    }
    console.log('Detected PJ64 version', this.emulatorVersion);

    this.settingsManager = settingsManager;

    this.isAutoPatchingEnabled = this.settingsManager.getBoolean(SettingsManager.PATH_IS_AUTO_PATCHING_ENABLED);
    this.subscriptions.time = MemoryWatcher.watchBytes(
      processId,
      processObject.handle,
      this.baseAddress + 0x32d580,
      4
    ).subscribe(({ currentValue }) => {
      const frameCount = currentValue.readUInt32LE(0);
      if (frameCount < 10) {
        this.state = EmulatorState.CONNECTED;
      }

      if (frameCount >= 210 && frameCount < 300) { // Wait until RAM injection is available
        if (this.state === EmulatorState.CONNECTED) {
          if (this.isAutoPatchingEnabled) {
            this.patchMemory();
          }
          if (this.isRestoringFileAFlagsEnabled) {
            this.restoreFlags();
          }
          this.isSkipIntroEnabled = this.settingsManager.getBoolean(SettingsManager.PATH_IS_SKIP_INTRO_ENABLED);
          if (this.isSkipIntroEnabled) {
            this.setSkipIntroEnabled(this.isSkipIntroEnabled);
          }
        }
      }
    });

    this.subscriptions.fileAFlags = MemoryWatcher.watchBytes(
      processId,
      processObject.handle,
      this.baseAddress + 0x207700,
      112
    ).subscribe(({ oldValue, currentValue }) => {
      if (this.isRestoringFileAFlagsEnabled) {
        if (currentValue > oldValue) {
          // Whenever progress is gained, save the flags into the settings file
          const oldSaveFlagsBase64 = this.settingsManager.get(SettingsManager.PATH_FILE_A_FLAGS_B64);
          if (oldSaveFlagsBase64) {
            // If there are existing flags, first check if there is more progress in the current flags
            const oldSaveFlags = Buffer.from(oldSaveFlagsBase64 as string, 'base64');
            if (oldSaveFlags.compare(currentValue) < 0) {
              this.settingsManager.set(SettingsManager.PATH_FILE_A_FLAGS_B64, currentValue.toString('base64'));
            }
          } else {
            this.settingsManager.set(SettingsManager.PATH_FILE_A_FLAGS_B64, currentValue.toString('base64'));
          }
        }
      }
    });

    this.subscriptions.deathTimerFix = MemoryWatcher.watchBytes(
      processId,
      processObject.handle,
      this.baseAddress + 0x33b17c,
      2,
    ).subscribe(({ currentValue }) => {
      const actionId = currentValue.readUInt16LE(0);
      if (
        actionId === 0x1302 || // action star dance with exit
        actionId === 0x1303 || // action star dance underwater
        actionId === 0x1307 || // action star dance no exit
        actionId === 0x1904 || // action fall after star grab
        actionId === 0x1909 // action grand star dance
      ) {
        this.writeMemory(0x36af28, Buffer.alloc(2));
      }
    });

    this.changeCharacter(0);
    this.reset();

    this.state = EmulatorState.CONNECTED;
  }

  /**
   * Unsubscribe all subscriptions, and release other resources.
   */
  public destroy(): void {
    Object.values(this.subscriptions).forEach((subscription) => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
  }

  public restoreFlags(): void {
    const savedFlagsBase64 = this.settingsManager.get(SettingsManager.PATH_FILE_A_FLAGS_B64);
    let savedFlags: Buffer;
    if (savedFlagsBase64) {
      savedFlags = Buffer.from(savedFlagsBase64 as string, 'base64');
    } else {
      savedFlags = Buffer.alloc(112);
    }
    this.writeMemory(0x207700, savedFlags);
  }

  public setSkipIntroEnabled(value: boolean): void {
    if (value) { // skip intro
      this.writeMemory(0x24bbd6, Buffer.from([0x00, 0x24]));
    } else { // watch intro
      this.writeMemory(0x24bbd6, Buffer.from([0x40, 0x10]));
    }
  }

  public reset(): void {
    // required for net64 patch compatibility
    this.setGameMode(1);
    this.setConnectionFlag(2);
    const buffer = Buffer.alloc(0x1c);
    for (let i = 0; i < 24; i++) {
      this.writeMemory(0xff7800 + 0x100 * i, buffer);
    }
  }

  public setConnectionFlag(connectionFlag: number): void {
    // required for net64 patch compatibility
    const tokenBuffer = Buffer.allocUnsafe(1);
    tokenBuffer.writeUInt8(connectionFlag, 0);
    this.writeMemory(0xff5ffc, tokenBuffer);
  }

  public setGameMode(gameMode: number): void {
    // required for net64 patch compatibility
    const gameModeBuffer = Buffer.from(new Uint8Array([ gameMode ]).buffer as ArrayBuffer);
    const emptyBuffer = Buffer.alloc(0xc);
    emptyBuffer.writeUInt8(gameMode, 6);
    this.writeMemory(0xff5ff7, gameModeBuffer);
    this.writeMemory(0xff7710, emptyBuffer);
    this.writeMemory(0xff7810, emptyBuffer);
  }

  /**
   * Reads from the 'patches' folder and returns a list of all available patches.
   */
  public getAvailablePatches(): string[] {
    return fs
      .readdirSync(patchesRoot)
      .filter((filePath) => fs.lstatSync(path.join(patchesRoot, filePath)).isDirectory());
  }

  /**
   * Retrieve the patch metadata file, given the name of the patch.
   * @param patchName - Name of the patch, i.e. the name of the folder under the patches root directory.
   */
  public getPatchMetadata(patchName: string): PatchMetadata {
    return JSON.parse(
      fs.readFileSync(path.join(patchesRoot, patchName, 'metadata.json')).toString('utf8')
    ) as PatchMetadata;
  }

  /**
   * Injects all patch files in the 'patches' folder into the emulator RAM.
   * @param requestedPatches - Names of directories in 'patches' folder to read patch files from. Defaults to all available patches.
   */
  public async patchMemory(requestedPatches?: string[]): Promise<void> {
    this.state = EmulatorState.PATCHING;
    console.log('Patching memory');

    const availablePatches = this.getAvailablePatches();
    console.log({ availablePatches });
    let appliedPatches: string[] = [];

    if (requestedPatches === undefined) {
      appliedPatches = availablePatches; // If not specified
    } else {
      appliedPatches = availablePatches.filter(requestedPatches.includes);
    }

    for (const patchName of appliedPatches) {
      const patchFiles = fs.readdirSync(path.join(patchesRoot, patchName, 'payload'));
      const { byteOrder, requirements } = this.getPatchMetadata(patchName);

      // PJ64 v1.6 does not support 16MB emulated RAM; skip all those patches by default
      if (
        requestedPatches === undefined &&
        this.emulatorVersion === '1.6' &&
        requirements.includes('16MB Emulated RAM')
      ) {
        console.log('Skipping', patchName, 'due to unmet 16MB RAM requirement.');
        continue;
      }

      const patchBufferPromises = patchFiles.map((patch) => {
        return new Promise<{ patchId: number; data: Buffer }>((resolve, reject) => {
          fs.readFile(path.join(patchesRoot, patchName, 'payload', patch), (error, data) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                patchId: parseInt(patch, 16),
                data,
              });
            }
          });
        });
      });

      const patchBuffers = await Promise.all(patchBufferPromises);
      for (const patchBuffer of patchBuffers) {
        let swappedData: Buffer;
        switch (byteOrder) {
          case '16':
            swappedData = patchBuffer.data.swap16();
            break;
          case '32':
            swappedData = patchBuffer.data.swap32();
            break;
          case '64':
            swappedData = patchBuffer.data.swap64();
            break;
          default:
            swappedData = patchBuffer.data;
            break;
        }
        this.writeMemory(patchBuffer.patchId, swappedData);
      }
      console.log('patched', patchName);
    }
    console.log('finished patching');

    this.state = EmulatorState.PATCHED;
  }

  /**
   * @param {number} offset - Offset
   * @param {Buffer} buffer - Buffer
   */
  public writeMemory(offset: number, buffer: Buffer): void {
    this.processReadWrite.writeMemory(this.baseAddress + offset, buffer);
  }

  /**
   * Reads memory.
   *
   * @param {number} offset - Offset to read from
   * @param {number} length - How many
   * @returns {Buffer} Memory buffer
   */
  public readMemory(offset: number, length: number): Buffer {
    const memory = this.processReadWrite.readMemory(this.baseAddress + offset, length);
    if (memory instanceof Buffer) {
      return memory;
    }
    // let errorMessage = 'An error occured. Please double check whether your memory is set to 16MB and/or try starting Net64+ and PJ64 with admin privileges'
    let errorMessage = 'An unknown error occured';
    switch (memory) {
      case 6:
        errorMessage = 'Insufficient permission to read memory. Try starting Net64+ with admin privileges';
        break;
      case 299:
        errorMessage =
          'Your memory is not set to 16MB. You are either not using the shipped emulator or you did not restart the emulator after chaning your settings to 16MB';
        break;
    }
    throw new Error(errorMessage);
  }

  /**
   *
   */
  public doEffect(effect: string): void {
    const messageBuffer = Buffer.from(effect);
    const effectMessage = Buffer.alloc(512);
    const minBitsBuffer = Buffer.from([ 0x0a ]);
    const cheerBitsBuffer = Buffer.from([ 0xff ]);
    try {
      messageBuffer.copy(effectMessage, 0, 0, Math.min(512, effectMessage.length));
      effectMessage.swap32();
      this.writeMemory(0x36affc, minBitsBuffer); // This is probably not required but is done by the original program, probably in case the streamer changed it mid-way
      this.writeMemory(0x36f000, cheerBitsBuffer); // This is required to bypass the bits logic in the asm. We set it to 0xff to bypass any bit limit
      this.writeMemory(0x36f010, effectMessage); // This is where the command string is supposed to go
    } catch (err) {
      // TODO
      console.error(err);
    }
  }

  /**
   * Writes new character ID into memory.
   *
   * @param {number} characterId - Character ID to write to
   */
  public changeCharacter(characterId: number): void {
    const b = Buffer.allocUnsafe(1);
    b.writeUInt8(characterId + 1, 0);
    this.writeMemory(0xff5ff3, b);
  }
}
