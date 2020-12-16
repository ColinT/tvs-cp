import * as memoryjs from 'memoryjs';
import { Observable, timer } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export class MemoryWatcher {
  static watchBytes(handle: number, offset: number, length: number, updateInterval = 33): Observable<Buffer> {
    return timer(0, updateInterval).pipe(
      map(() => memoryjs.readBuffer(handle, offset, length) as Buffer),
      distinctUntilChanged((buffer1, buffer2) => buffer1.equals(buffer2))
    );
  }
}
