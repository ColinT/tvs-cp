import * as memoryjs from 'memoryjs';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, pairwise, startWith } from 'rxjs/operators';
import { isProcessAlive } from './utils';

export class MemoryWatcher {
  static watchBytes(processId: number, handle: number, offset: number, length: number, updateInterval = 33): Observable<{ oldValue: Buffer, currentValue: Buffer }> {
    return new Observable<Buffer>((subscriber) => {
      const readInterval = setInterval(checkIfProcessIsAlive, updateInterval);
      function checkIfProcessIsAlive() {
        if (isProcessAlive(processId)) {
          subscriber.next(memoryjs.readBuffer(handle, offset, length));
        } else {
          subscriber.complete();
          clearInterval(readInterval);
        }
      }
      checkIfProcessIsAlive();
    }).pipe(
      distinctUntilChanged((buffer1, buffer2) => buffer1.equals(buffer2)),
      startWith(null),
      pairwise(),
      map(([oldValue, currentValue]) => ({
        oldValue: oldValue ?? currentValue ?? Buffer.alloc(length),
        currentValue: currentValue ?? Buffer.alloc(length),
      })),
    );
  }
}
