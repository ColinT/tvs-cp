# Twitch Versus Streamer - Channel Points (tvs-cp)

# 1. Introduction

Currently maintained by:
 - [ColinT](https://github.com/ColinT)

This project uses code from [Twitch Versus Mario](https://www.youtube.com/watch?v=nWnnkn4D2I8) and [Net64](https://github.com/Tarnadas/net64plus). A huge thank-you to the developers and maintainers of these projects.

This project is not yet available as an executable binary. **This means you have to read to use it.** I know, reading is hard, but you can do it!

# 2. Setup

## 2.1. NodeJS

This is a NodeJS project. [Download NodeJS LTS here](https://nodejs.org/en/download/).

After installing NodeJS, open the project directory in a terminal and install the dependencies:

```
npm install
```

Then build the project:

```
npm run build
```

## 2.2. Environment variables

Twitch requires an OAuth token to read channel point redemptions. You can generate an OAuth token with the correct scope using the Twitch Chat OAuth Token Generator [here](https://id.twitch.tv/oauth2/authorize?client_id=q6batx0epp608isickayubi39itsckt&redirect_uri=https%3A%2F%2Ftwitchapps.com%2Ftmi%2F&response_type=token&scope=channel%3Aread%3Aredemptions).

To store the token securely, create a file named `.env` at the root of the project folder with the key `OAUTH_TOKEN`. For example, if your token was `oauth:abcdefg1234567` use the following command:

```
echo OAUTH_TOKEN=abcdefg1234567 > .env
```

This should create a `.env` file with the contents:

```env
OAUTH_TOKEN=abcdefg1234567

```

**NOTE**: Make sure `.env` is the full name of the file including the file extension.

## 2.3. Channel Point Rewards

This project uses the **name** of the custom channel points rewards as the command to run. For example, a reward named `!donate` will activate the `!donate` command. You will have to create a separate reward for each command. You can find all the available commands in `commands.txt`.

I recommend enabling "Skip Reward Request Queue" so that the commands do not interfere with your other rewards.

# 3. Running the Project

Running the project correctly requires a certain order of operations:

1. Open Project64.
2. Open the ROM.
3. Proceed to file select in game, but do not select a file.
4. Start the project using the command `npm start`.
5. Select a file in game.
6. Start playing!
