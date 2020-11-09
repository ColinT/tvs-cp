import * as memoryjs from 'memoryjs';

import * as fs from 'fs';
import * as path from 'path';

import { Process } from 'common/types/Process';
import { EmulatorState } from 'common/states/EmulatorState';

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
  private processReadWrite: ProcessReadWrite;

  private state = EmulatorState.NOT_CONNECTED;
  private emulatorVersion: '1.6' | '2.2MM';

  public getState(): EmulatorState {
    return this.state;
  }

  /**
   * A list of available Processes.
   * 
   * @param {RegExp} [processName] - Filter the results with a regular expression.
   */
  public static getAllProcesses(processName?: RegExp): Process[] {
    if (processName) {
      return memoryjs.getProcesses().filter((process: Process) => {
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
  constructor(processId: number) {
    this.state = EmulatorState.CONNECTING;
    console.log('Emulator constructor called with processId:', processId);
    try {
      memoryjs.openProcess(processId);
    } catch (error) {
      console.log('error opening process with id', processId);
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

    switch (processObject.modBaseAddr) {
      case 4194304:
        this.emulatorVersion = '1.6';
        break;
      case 9175040:
        this.emulatorVersion = '2.2MM';
        break;
    }
    console.log('Detected PJ64 version', this.emulatorVersion);

    this.changeCharacter(0);
    this.reset();

    this.state = EmulatorState.CONNECTED;
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
