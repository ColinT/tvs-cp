import { Component } from '@angular/core';

@Component({
  selector: 'oauth',
  templateUrl: './oauth.component.html',
  styleUrls: [ './oauth.component.scss' ],
})
export class OAuthComponent {
  public newTokenUrl = `https://id.twitch.tv/oauth2/authorize?client_id=q6batx0epp608isickayubi39itsckt&redirect_uri=https%3A%2F%2Ftwitchapps.com%2Ftmi%2F&response_type=token&scope=channel%3Aread%3Aredemptions`;
}
