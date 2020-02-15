export interface FilteredEmulator {
  name: string;
  pid: number;
  windowName?: string;
}

export interface Process {
  readMemory: (offset: number, length: number) => Buffer | number;
  writeMemory: (offset: number, buffer: Buffer) => void;
}

import { snapshot } from 'process-list';
import * as parse from 'csv-parse';
// import * as winprocess from 'winprocess';
import * as memoryjs from 'memoryjs';

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { spawn } from 'child_process';

const tasklist = promisify(snapshot);

/**
 * An Emulator object represents the connection
 * to the loaded emulator.
 */
export class Emulator {
  public baseAddress: number;

  public inGameChatEnabled = false;

  private process: Process;

  public static async getEmulatorsFromTasklist(): Promise<FilteredEmulator[]> {
    return (await Promise.all(
      (await new Promise<string[][]>((resolve, reject) => {
        try {
          const tasklist = spawn('tasklist', [ '/FO', 'CSV', '/NH' ]);
          let stdout = '';
          tasklist.stdout.on('data', (data) => {
            stdout += data.toString();
          });
          tasklist.stderr.on('data', (data) => {
            console.error(`tasklist stderr: ${data}`);
          });
          tasklist.on('error', (err) => reject(err));
          tasklist.on('close', (code) => {
            if (code !== 0) {
              console.warn(`tasklist process exited with code ${code}`);
              return;
            }
            parse(stdout, {}, (err: Error | undefined, data: string[][]) => {
              if (err) reject(err);
              resolve(data);
            });
          });
        } catch (err) {
          console.error(err);
          reject(err);
        }
      }))
        .filter((process: string[]) => process[0].match(/project64/i))
        .map(
          (process) =>
            new Promise<string[]>((resolve, reject) => {
              const tasklist = spawn('tasklist', [ '/FI', `PID eq ${process[1]}`, '/FO', 'CSV', '/NH', '/V' ]);
              let stdout = '';
              tasklist.stdout.on('data', (data) => {
                stdout += data.toString();
              });
              tasklist.stderr.on('data', (data) => {
                console.error(`tasklist stderr: ${data}`);
              });
              tasklist.on('close', (code) => {
                if (code !== 0) {
                  console.warn(`tasklist process exited with code ${code}`);
                }
                parse(stdout, {}, (err: Error | undefined, data: string[][]) => {
                  if (err) reject(err);
                  if (data.length === 0) reject(new Error(`tasklist couldn't find process with PID ${process[1]}`));
                  resolve(data[0]);
                });
              });
            })
        )
    )).map((process: string[]) => ({
      name: process[0],
      pid: parseInt(process[1]),
      windowName: process[8],
    }));
  }

  private static async getEmulatorsFromNativeNodeBinaries(): Promise<FilteredEmulator[]> {
    return (await tasklist({
      name: true,
      pid: true,
    })).filter(({ name }: FilteredEmulator) => name.match(/project64/i));
  }

  /**
   * Emulator constructor.
   *
   * @param {number} processId - Process ID to load
   * @param {number} characterId - Character ID from settings
   * @param {boolean} [inGameChatEnabled=false] - Whether in game chat should be enabled
   */
  constructor(processId: number, characterId: number, inGameChatEnabled = false) {
    this.inGameChatEnabled = inGameChatEnabled;
    const processObject = memoryjs.openProcess(processId);
    this.process = {
      readMemory: (offset: number, length: number) => memoryjs.readBuffer(processObject.handle, offset, length),
      writeMemory: (offset: number, buffer: Buffer) => memoryjs.writeBuffer(processObject.handle, offset, buffer),
    };
    this.baseAddress = -1;
    for (let i = 0x00000000; i <= 0xffffffff; i += 0x1000) {
      const buf1 = this.process.readMemory(i, 4);
      if (typeof buf1 !== 'object') continue;
      const val1 = buf1.readUInt32LE(0);
      if (val1 !== 0x3c1a8032) continue;
      const buf2 = this.process.readMemory(i + 4, 4);
      if (typeof buf2 !== 'object') continue;
      const val2 = buf2.readUInt32LE(0);
      if (val2 !== 0x275a7650) continue;
      this.baseAddress = i;
    }
    if (this.baseAddress === -1) {
      throw new Error('Could not find base address');
    }
    if (!this.checkMemory()) {
      throw new Error('Memory check failed');
    }
  }

  private checkMemory(): boolean {
    try {
      this.readMemory(0xff5ff0, 0x10);
      return true;
    } catch (err) {}
    return false;
  }

  /**
   * Injects all patch files in the 'patches' folder into the emulator RAM.
   */
  public async patchMemory(): Promise<void> {
    const basePath = process.env.NODE_ENV === 'test' ? './build/patches' : './patches';
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
    this.process.writeMemory(this.baseAddress + offset, buffer);
  }

  /**
   * Reads memory.
   *
   * @param {number} offset - Offset to read from
   * @param {number} length - How many
   * @returns {Buffer} Memory buffer
   */
  public readMemory(offset: number, length: number): Buffer {
    const memory = this.process.readMemory(this.baseAddress + offset, length);
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
