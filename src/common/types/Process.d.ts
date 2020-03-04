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
