import chalk from 'chalk';
import inquirer from 'inquirer';
import { ORANGE_RGB } from '../utils/display-utils.js';

export default class MainMenuScreen {

  static MENU_OPTIONS = {
    ANIMAL_ADD: 'animal_add',
    ANIMAL_LIST: 'animal_list',
    BREED_ADD: 'breed_add',
    USER_ADD: 'user_add',
    CLEAR_SCREEN: 'clear_screen',
    EXIT: 'exit'
  };

  static async show() {
    console.log(); // Empty line before main menu
    return await inquirer.prompt({
      type: 'list',
      name: 'option',
      message: 'Animal Shelter Main Menu - Select an option from below:',
      choices: [
        { name: `${chalk.green('🞣')} Register Animal`, value: this.MENU_OPTIONS.ANIMAL_ADD },
        { name: `${chalk.cyan('≣')}  Manage Animals`, value: this.MENU_OPTIONS.ANIMAL_LIST },
        new inquirer.Separator(),
        { name: `${chalk.green('🞣')} Add New Breed`, value: this.MENU_OPTIONS.BREED_ADD },
        new inquirer.Separator(),
        { name: `${chalk.green('🞣')} Add New User`, value: this.MENU_OPTIONS.USER_ADD },
        new inquirer.Separator(),
        { name: `${chalk.yellow('⌧')}  Clear Screen`, value: this.MENU_OPTIONS.CLEAR_SCREEN },
        { name: `${chalk.rgb(...ORANGE_RGB)('⭙')}  Logoff`, value: this.MENU_OPTIONS.EXIT }
      ],
      loop: false,
      pageSize: 7
    });
  }

}
