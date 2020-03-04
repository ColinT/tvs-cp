import * as fs from 'fs';
import * as path from 'path';

import { cwd } from 'server/app';

/**
 * Manages the settings file for user settings.
 */
export class SettingsManager {
  private _path: string;
  private _settings: Settings;

  /**
   * @constructor
   * @param path - The path to the settings file
   */
  constructor(path: string) {
    this._path = path;
    if (!fs.existsSync(path)) {
      // If the settings do not exist, initialize it to default settings
      this._settings = SettingsManager.getDefaultSettings();
      this.writeFileSync();
    }

    this.readFileSync();
  }

  /**
   * Read settings from file.
   */
  private readFileSync() {
    this._settings = JSON.parse(fs.readFileSync(this._path).toString());
  }

  /**
   * Write settings to file.
   */
  public writeFileSync() {
    fs.writeFileSync(this._path, JSON.stringify(this._settings));
  }

  /**
   * Get data at a nested key.
   * @param keyPath - The nested slash separated key to get data from.
   * @returns The data.
   */
  public get(keyPath: string): any {
    const splitPaths = keyPath.split('/');
    let currentNode = this._settings;
    for (const segment of splitPaths) {
      if (currentNode === undefined) {
        break;
      }
      currentNode = currentNode[segment];
    }
    return currentNode;
  }

  /**
   * Set data at a nested key. This data is serialized as a JSON.
   * @param keyPath - The nested slash separated key to write data to.
   * @param data - The data to write.
   * @param options.merge - Whether or not to merge the data. Otherwise unspecified fields are overwritten.
   */
  public set(keyPath: string, data: any, options: { merge: boolean } = { merge: false }) {
    const splitPaths = keyPath.split('/');

    if (splitPaths[0] === undefined) {
      // Attempting to modify root
      if (typeof data === 'object' && data !== null) {
        this._settings = JSON.parse(JSON.stringify(data));
      } else {
        throw new Error('Illegal operation. Root must be an object.');
      }
    } else {
      let currentNode = this._settings;
      let segment = splitPaths[0];

      for (let index = 0; index < splitPaths.length; index++) {
        segment = splitPaths[index];
        if (currentNode[segment] === undefined) {
          currentNode[segment] = {};
        } else if (typeof currentNode !== 'object' || currentNode === null) {
          // This node is not an object, we have to overwrite it as an empty object
          currentNode = {};
        }
        if (index !== splitPaths.length - 1) {
          currentNode = currentNode[segment];
        }
      }

      if (
        typeof currentNode[segment] === 'object' &&
        currentNode[segment] !== null &&
        typeof data === 'object' &&
        data !== null &&
        options.merge
      ) {
        // If the target key and data are object, and we are supposed to merge, then merge the data
        currentNode[segment] = JSON.parse(JSON.stringify(this.recursiveMerge(data, currentNode[segment])));
      } else {
        // Overwrite the data
        currentNode[segment] = JSON.parse(JSON.stringify(data));
      }
    }

    // Save the settings file
    this.writeFileSync();
  }

  private recursiveMerge(source: Object, target: Object): Object {
    if (typeof source === 'object' && source !== null && typeof target === 'object' && target !== null) {
      // If both source and target are objects then merge their properties
      for (const sourceKey in source) {
        if (source.hasOwnProperty(sourceKey)) {
          if (target.hasOwnProperty(sourceKey)) {
            if (
              typeof target[sourceKey] === 'object' &&
              target[sourceKey] !== null &&
              typeof source[sourceKey] === 'object' &&
              source[sourceKey] !== null
            ) {
              // If target has a property of the same name and they are both objects, then merge them
              target[sourceKey] = JSON.parse(JSON.stringify(this.recursiveMerge(source[sourceKey], target[sourceKey])));
            } else {
              // If only one of them is an object, then overwrite
              target[sourceKey] = JSON.parse(JSON.stringify(source[sourceKey]));
            }
          } else {
            // Target has no key of the same name, so just copy it over from the source
            target[sourceKey] = JSON.parse(JSON.stringify(source[sourceKey]));
          }
        }
      }
    } else {
      throw new Error('Both parameters must be Objects');
    }
    return target;
  }

  public static getDefaultSettings(): Settings {
    return {
      oAuthTokenPath: path.join(cwd, './oauth-token.txt'),
      oauth: {
        tokenSaveStatus: false,
      },
    };
  }
}

interface Settings {
  oAuthTokenPath?: string;
  oauth?: {
    tokenSaveStatus: boolean;
  };
}
