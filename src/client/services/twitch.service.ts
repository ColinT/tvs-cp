import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { baseUrl } from 'client/config';

@Injectable({
  providedIn: 'root',
})
export class TwitchService {
  constructor(private http: HttpClient) {}

  async executeCommand(command: string, userInput?: string): Promise<void> {
    await this.http
      .post(`${baseUrl}/api/twitch/execute-command`, {
        command,
        userInput,
      })
      .toPromise()
      .then((response) => {
        console.log(response);
      });
  }
}
