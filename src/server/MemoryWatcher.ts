import * as memoryjs from 'memoryjs';
import { Observable, timer } from 'rxjs';
import { distinctUntilChanged, map, pairwise, startWith } from 'rxjs/operators';

export class MemoryWatcher {
  static watchBytes(handle: number, offset: number, length: number, updateInterval = 33): Observable<{ oldValue: Buffer, currentValue: Buffer }> {
    return timer(0, updateInterval).pipe(
      map(() => memoryjs.readBuffer(handle, offset, length) as Buffer),
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
