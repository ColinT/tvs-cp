import * as WebSocket from 'ws';
import { OAuthManager } from 'server/OAuthManager';

export class ChannelPointsWebSocket {
  public static generateWebSocket(
    channelId: string,
    oAuthManager: OAuthManager,
    onMessage: (message: string) => void,
    onReconnect: () => void
  ): WebSocket {
    // Open pubsub websocket
    const wss = new WebSocket('wss://pubsub-edge.twitch.tv');
    wss.on('open', () => {
      console.log('Websocket is now open.');
      wss.send(
        JSON.stringify({
          type: 'LISTEN',
          data: {
            topics: [ `channel-points-channel-v1.${channelId}` ],
            auth_token: oAuthManager.getToken(),
          },
        })
      );

      // We need to PING the websocket connection to avoid a timeout after 5 minutes of inactivity
      setInterval(() => {
        wss.send(
          JSON.stringify({
            type: 'PING',
          })
        );
      }, 4 * 60 * 1000);
    });

    wss.on('message', (data) => {
      if (typeof data === 'string') {
        const res = JSON.parse(data);

        if (res.type === 'MESSAGE' && res.data.topic === `channel-points-channel-v1.${channelId}`) {
          onMessage(JSON.parse(res.data.message));
        }

        if (res.type === 'RECONNECT') {
          onReconnect();
          wss.close();
        }
      }
    });

    return wss;
  }
}
