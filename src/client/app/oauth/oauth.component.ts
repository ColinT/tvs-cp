import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'oauth',
  templateUrl: './oauth.component.html',
  styleUrls: [ './oauth.component.scss' ],
})
export class OAuthComponent implements OnInit {
  public newTokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=q6batx0epp608isickayubi39itsckt&redirect_uri=https%3A%2F%2Ftwitchapps.com%2Ftmi%2F&response_type=token&scope=channel%3Aread%3Aredemptions`;

  public tokenSaveStatus: boolean;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    this.tokenSaveStatus = await this.http
      .get<boolean>('http://localhost:3000/api/oauth/token-save-status')
      .toPromise();
  }
}
