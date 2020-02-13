import * as WebSocket from 'ws';

export class ChannelPointsWebSocket {
	public static generateWebSocket(
		channelId: string,
		onMessage: (message: string) => void,
		onReconnect: () => void
	): WebSocket {
		// Open pubsub websocket
		const wss = new WebSocket('wss://pubsub-edge.twitch.tv');
		wss.on('open', () => {
			wss.send(
				JSON.stringify({
					type: 'LISTEN',
					data: {
						topics: [ `channel-points-channel-v1.${channelId}` ],
						auth_token: process.env.OAUTH_TOKEN,
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
				}
			}
		});

		return wss;
	}
}
