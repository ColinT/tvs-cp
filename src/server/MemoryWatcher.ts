import * as memoryjs from 'memoryjs';
import { Observable, timer } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

export class MemoryWatcher {
  static watchBytes(handler, offset: number, length: number, updateInterval: number = 33): Observable<Buffer> {
    return timer(0, updateInterval).pipe(
      map(() => memoryjs.readBuffer(handler, offset, length) as Buffer),
      distinctUntilChanged((buffer1, buffer2) => buffer1.equals(buffer2))
    );
  }
}
