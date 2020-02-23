/**
 * @typedef {Object} Process - A memoryjs Process object
 * @see https://github.com/Rob--/memoryjs#process-object
 * @see https://docs.microsoft.com/en-us/windows/win32/api/tlhelp32/ns-tlhelp32-processentry32
 */
export interface Process {
  /** The process identifier */
  th32ProcessID: number;
  /** The identifier of the process that created this process */
  th32ParentProcessID: number;
  /** The number of execution threads started by the process */
  cntThreads: number;
  /** The base priority of any threads created by this process */
  pcPriClassBase: number;
  /** The name of the executable file for the process */
  szExeFile: string;
  dwSize?: number;
  modBaseAddr?: number;
  handle?: number;
}

export interface ProcessReadWrite {
  readMemory: (offset: number, length: number) => Buffer | number;
  writeMemory: (offset: number, buffer: Buffer) => void;
}

import * as memoryjs from 'memoryjs';

import * as fs from 'fs';
import * as path from 'path';

/**
 * An Emulator object represents the connection
 * to the loaded emulator.
 */
export class Emulator {
  public baseAddress: number;
  private processReadWrite: ProcessReadWrite;

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
    console.log('Emulator constructor called with processId:', processId);
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
  }

  /**
   * Injects all patch files in the 'patches' folder into the emulator RAM.
   */
  public async patchMemory(): Promise<void> {
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
}