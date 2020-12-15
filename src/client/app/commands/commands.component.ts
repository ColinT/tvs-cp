import { Component } from '@angular/core';

import { EmulatorState, EmulatorVersion } from 'common/states/EmulatorState';
import { EmulatorService } from 'client/services/emulator.service';
import { TwitchService } from 'client/services/twitch.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Patch {
  /** Title of the patch. */
  title: string;
  /** Patch description. */
  description: string;
  /** A list of commands that the patch includes. */
  commands: Command[];
  /** A function to disable the patch, e.g. if RAM requirements are not met. */
  disabled$: Observable<boolean>;
}

export interface Command {
  /** Name of the command (must match the redemption name). */
  name: string;
  /** Short description of what the command does. */
  description: string;
  /** Detailed description of what the command does. */
  content: string;
  /** Type which describes the format of the command. */
  type: 'basic' | 'userInput';
}

@Component({
  selector: 'commands',
  templateUrl: './commands.component.html',
  styleUrls: [ './commands.component.scss' ],
})
export class CommandsComponent {
  constructor(private emulatorService: EmulatorService, private twitchService: TwitchService) {}

  public EmulatorState = EmulatorState;
  public emulatorState$ = this.emulatorService.getEmulatorState$();

  public patches: Patch[] = [
    {
      title: 'Base commands',
      description: 'Default base patch',
      disabled$: of(false),
      commands: [
        {
          name: '!bird',
          description: "Bird's eye view camera",
          content: "Puts the camera into bird's eye view temporarily.",
          type: 'basic',
        },
        {
          name: '!blooper',
          description: 'Scroll random text across the screen',
          content: 'Adds random text that quickly scrolls across the screen temporarily.',
          type: 'basic',
        },
        {
          name: '!bup',
          description: 'Plays the toad jingle',
          content: 'Plays the jingle that happens when you talk to a toad.',
          type: 'basic',
        },
        {
          name: '!chatbox',
          description: 'Pop up a chatbox',
          content: `
            Pops up a chatbox in-game which the player has to scroll through and dismiss.
            The chatbox will contain the user input of the channel point reward redemption.
            This command can cause soft-locks if the player is put in a state where they
            cannot dismiss the chatbox.
          `,
          type: 'userInput',
        },
        {
          name: '!deathtimer',
          description: 'Starts a countdown that kills Mario',
          content: `
            Starts (or restarts) a 60 second countdown that will void Mario out at the end.
            There is a GS code that will cancel the countdown when you get a star or key.
          `,
          type: 'basic',
        },
        {
          name: '!demon',
          description: 'Spawns a green demon',
          content: `
            Spawns a green demon, (a 1-UP that follows and kills Mario). The green
            demon kills Mario through damage, so you can prevent the death by
            being in an invulnerable state.
          `,
          type: 'basic',
        },
        {
          name: '!donate',
          description: 'Adds 1 to the current coin counter',
          content: 'Adds 1 coin to the coin count. This will not spawn the 100 coin star.',
          type: 'basic',
        },
        {
          name: '!drain',
          description: 'Deals damage to Mario',
          content: 'Removes half of the pie slices from the power meter, rounded up. Can kill Mario.',
          type: 'basic',
        },
        {
          name: '!explode',
          description: 'Explode the current object',
          content: `
            Removes an object near Mario, and replaces it with an explosion object.
            The explosion can interact with other objects and damage Mario like
            a regular Bob-omb explosion.
          `,
          type: 'basic',
        },
        {
          name: '!freezecam',
          description: 'Stationary camera',
          content: 'Prevents the camera from moving laterally temporarily.',
          type: 'basic',
        },
        {
          name: '!gbj',
          description: 'GBJ',
          content: 'Prevents Mario from moving for a while.',
          type: 'basic',
        },
        {
          name: '!gravity',
          description: 'Lowers all jumps',
          content: "Tmporarily reduces all forms of Mario's vertical speeds, which reduces jump height.",
          type: 'basic',
        },
        {
          name: '!groundpound',
          description: 'Causes accidental groundpounds',
          content: 'Converts all longjump inputs into groundpounds temporarily.',
          type: 'basic',
        },
        {
          name: '!halfapress',
          description: 'Prevents A presses',
          content: 'Causes the game to ignore all A presses temporarily',
          type: 'basic',
        },
        {
          name: '!heal',
          description: 'Heals Mario by one pie slice',
          content: 'Adds one pie slice to the power meter.',
          type: 'basic',
        },
        {
          name: '!hotfloor',
          description: 'Hop constantly',
          content: 'Causes Mario to temporarily hop as soon as he touches the floor over and over again.',
          type: 'basic',
        },
        {
          name: '!ice',
          description: 'Turns the floor to ice',
          content: 'Causes the floor triangle that Mario is currently above to turn into the ice collision type.',
          type: 'basic',
        },
        {
          name: '!inviswall',
          description: 'Makes Mario bonk',
          content: 'Instantly causes Mario to enter the bonk state.',
          type: 'basic',
        },
        {
          name: '!lava',
          description: 'Turns the floor to lava',
          content: 'Causes the floor triangle that Mario is currently above to turn into the lava collision type.',
          type: 'basic',
        },
        {
          name: '!metal',
          description: 'Toggles the metal cap',
          content: 'Toggles the metal cap power up, without a timer.',
          type: 'basic',
        },
        {
          name: '!rocket',
          description: 'Makes Mario triple jump flip',
          content: 'Instantly puts Mario in the triple jump flip state, which also gives him extra height.',
          type: 'basic',
        },
        {
          name: '!shell',
          description: 'Gives Mario a shell',
          content: 'Instantly puts Mario into riding a shell state.',
          type: 'basic',
        },
        {
          name: '!speed',
          description: 'Gives Mario forward speed',
          content: 'Instantly gives Mario a huge amount of forward speed.',
          type: 'basic',
        },
        {
          name: '!squash',
          description: 'Squashes Mario',
          content: 'Instantly puts Mario into the squashed state.',
          type: 'basic',
        },
        {
          name: '!steal',
          description: 'Subtracts 1 from the current coin counter',
          content: 'Subtracts 1 from the current coin count.',
          type: 'basic',
        },
        {
          name: '!turn',
          description: 'Turns Mario around',
          content: "Instantly changes Mario's angle by 180 degrees.",
          type: 'basic',
        },
        {
          name: '!upsidedown',
          description: 'Turns the camera upsidedown',
          content: 'Temporarily causes the camera to flip around.',
          type: 'basic',
        },
        {
          name: '!vanish',
          description: 'Toggles the vanish cap',
          content: 'Toggles the vanish cap power up, without a timer.',
          type: 'basic',
        },
        {
          name: '!wallbonk',
          description: '???',
          content: `
            I am not sure what this command does, but it comes in the original TvS. Let me know if
            you figure it out, and I will document it!
          `,
          type: 'basic',
        },
        {
          name: '!wind',
          description: 'Creates temporary wind',
          content: 'Creates temporary wind which blows Mario in the X direction.',
          type: 'basic',
        },
        {
          name: '!wing',
          description: 'Toggles the wing cap',
          content: 'Toggles the wing cap power up, without a timer.',
          type: 'basic',
        },
      ],
    },
    {
      title: 'Net64 commands',
      description: 'Requires PJ64 v2.2MM',
      disabled$: this.emulatorService
        .getEmulatorVersion$()
        .pipe(map((emulatorVersion) => emulatorVersion !== EmulatorVersion.VERSION_2_2_MM)),
      commands: [
        {
          name: '!changecharacter',
          description: 'Changes the current character',
          content: `
            Changes Mario into one of the playable characters in Net64 based on user input.
            Available characters are: Mario, Luigi, Wario, Waluigi, Yoshi, Toad, Peach,
            Rosalina, Sonic, Knuckles, and Kirby. If the exact name is not entered, the program
            will try its best to find the closest match.
          `,
          type: 'userInput',
        },
      ],
    },
  ];

  async testCommand(name: string, userInput?: string): Promise<void> {
    await this.twitchService.executeCommand(name, userInput);
  }
}
