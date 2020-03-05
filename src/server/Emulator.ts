import * as memoryjs from 'memoryjs';

import * as fs from 'fs';
import * as path from 'path';

import { Process } from 'common/types/Process';
import { EmulatorState } from 'common/states/EmulatorState';

export interface ProcessReadWrite {
  readMemory: (offset: number, length: number) => Buffer | number;
  writeMemory: (offset: number, buffer: Buffer) => void;
}

/**
 * An Emulator object represents the connection
 * to the loaded emulator.
 */
export class Emulator {
  public baseAddress: number;
  private processReadWrite: ProcessReadWrite;

  private state = EmulatorState.NOT_CONNECTED;

  public getState() {
    return this.state;
  }

  /**
   * A list of available Processes.
   * 
   * @param {RegExp} [processName] - Filter the results with a regular expression.
   */
  public static getAllProcesses(processName?: RegExp): Process[] {
    if (!!processName) {
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
      const processList = Emulator.getAllProcesses(/project64/i);
      console.log(processList);
      memoryjs.openProcess(processId);
    } catch (error) {
      console.log('error opening process with id', processId);
    }
    const processObject = memoryjs.openProcess(processId);
    console.log('Process loaded successfully');
    this.processReadWrite = {
      readMemory: (offset: number, length: number) => memoryjs.readBuffer(processObject.handle, offset, length),
      writeMemory: (offset: number, buffer: Buffer) => memoryjs.writeBuffer(processObject.handle, offset, buffer),
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

    this.changeCharacter(0);
    this.reset();

    this.state = EmulatorState.CONNECTED;
  }

  public reset(): void {
    this.setGameMode(1);
    this.setConnectionFlag(2);
    const buffer = Buffer.alloc(0x1c);
    for (let i = 0; i < 24; i++) {
      this.writeMemory(0xff7800 + 0x100 * i, buffer);
    }
  }

  public setConnectionFlag(connectionFlag): void {
    const tokenBuffer = Buffer.allocUnsafe(1);
    tokenBuffer.writeUInt8(connectionFlag, 0);
    this.writeMemory(0xff5ffc, tokenBuffer);
  }

  public setGameMode(gameMode: number): void {
    const gameModeBuffer = Buffer.from(new Uint8Array([ gameMode ]).buffer as ArrayBuffer);
    const emptyBuffer = Buffer.alloc(0xc);
    emptyBuffer.writeUInt8(gameMode, 6);
    this.writeMemory(0xff5ff7, gameModeBuffer);
    this.writeMemory(0xff7710, emptyBuffer);
    this.writeMemory(0xff7810, emptyBuffer);
  }

  /**
   * Injects all patch files in the 'patches' folder into the emulator RAM.
   */
  public async patchMemory(): Promise<void> {
    this.state = EmulatorState.PATCHING;
    console.log('Patching memory');
    const basePath = './patches';
    const patches = fs.readdirSync(basePath);
    const patchBuffersPromise: Promise<{ patchId: number; data: Buffer }>[] = [];
    for (const patch of patches) {
      patchBuffersPromise.push(
        new Promise((resolve, reject) => {
          fs.readFile(path.join(basePath, patch), (err, data) => {
            if (err) reject(err);
            resolve({
              patchId: parseInt(patch, 16),
              data,
            });
          });
        })
      );
    }
    const patchBuffers = await Promise.all(patchBuffersPromise);
    for (const patchBuffer of patchBuffers) {
      this.writeMemory(patchBuffer.patchId, patchBuffer.data.swap32());
    }

    const net64BasePath = './net64-patches';
    const net64Patches = fs.readdirSync(net64BasePath);
    const net64PatchBuffersPromise: Promise<{ patchId: number; data: Buffer }>[] = [];
    for (const net64Patch of net64Patches) {
      net64PatchBuffersPromise.push(
        new Promise((resolve, reject) => {
          fs.readFile(path.join(net64BasePath, net64Patch), (err, data) => {
            if (err) reject(err);
            resolve({
              patchId: parseInt(net64Patch, 16),
              data,
            });
          });
        })
      );
    }
    const net64PatchBuffers = await Promise.all(net64PatchBuffersPromise);
    for (const net64PatchBuffer of net64PatchBuffers) {
      this.writeMemory(net64PatchBuffer.patchId, net64PatchBuffer.data);
    }

    this.state = EmulatorState.PATCHED;
  }

  /**
   * @param {number} offset - Offset
   * @param {Buffer} buffer - Buffer
   */
  public writeMemory(offset: number, buffer: Buffer) {
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
  public doEffect(effect: string) {
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
