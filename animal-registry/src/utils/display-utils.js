import boxen from 'boxen';
import chalk from 'chalk';

export const ORANGE_RGB = [255, 141, 51];

export class Alert {
  static #BASE_CONFIG = {
    padding: 1,
    margin: 1,
    width: 50,
    borderStyle: 'round',
    dimBorder: true
  };

  static error(message, title) {
    console.log(boxen(message, {
      ...this.#BASE_CONFIG,
      title: chalk.redBright.bold(`⨉ ${title ?? 'Error'}`),
      borderColor: 'red',
    }));
  }

  static success(message, title) {
    console.log(boxen(message, {
      ...this.#BASE_CONFIG,
      title: chalk.greenBright.bold(`✔ ${title ?? 'Success'}`),
      borderColor: 'green',
    }));
  }

  static warn(message, title) {
    console.log(boxen(message, {
      ...this.#BASE_CONFIG,
      title: chalk.rgb(...ORANGE_RGB).bold(`⚠  ${title ?? 'Warning'}`),
      borderColor: '#FF8D33'
    }));
  }

  static info(message, title) {
    console.log(boxen(message, {
      ...this.#BASE_CONFIG,
      title: chalk.blueBright.bold(`ℹ ${title ?? 'Info'}`),
      borderColor: 'blue'
    }));
  }

}

export class DisplayRecordConfig {
  /**
   * @constructor
   * @param {string} header
   * @param {string} dataPath Dot-notation path
   * @param {Function?} dataTransform
   * @param {'left'|'center'|'right'} align
   * @param {string?} defaultData
   * @param {Function?} defaultDataTransform
   */
  constructor(header, dataPath, dataTransform = undefined, align = undefined, defaultData = undefined, defaultDataTransform = undefined) {
    this.header = header;
    this.dataPath = dataPath;
    this.dataTransform = dataTransform;
    this.align = align ?? 'left';
    this.defaultData = defaultData;
    this.defaultDataTransform = defaultDataTransform;
  }
}
