import inquirer from 'inquirer';

const OPTION_ANIMAL_ADD = 'Register Animal';
const OPTION_ANIMAL_DELETE = 'Delete Animal';
const OPTION_ANIMAL_LIST = 'Display Animals';
const OPTION_BREED_ADD = 'Add New Breed';
const OPTION_CLEAR_SCREEN = 'Clear Screen';
const OPTION_EXIT = 'Exit';

export default class MainMenuScreen {

  static options = {
    ANIMAL_ADD: OPTION_ANIMAL_ADD,
    ANIMAL_DELETE: OPTION_ANIMAL_DELETE,
    ANIMAL_LIST: OPTION_ANIMAL_LIST,
    BREED_ADD: OPTION_BREED_ADD,
    CLEAR_SCREEN: OPTION_CLEAR_SCREEN,
    EXIT: OPTION_EXIT
  };

  static async show() {
    return await inquirer.prompt({
      type: 'list',
      name: 'option',
      message: 'What do you want to do?',
      choices: [
        OPTION_ANIMAL_ADD,
        OPTION_ANIMAL_DELETE,
        OPTION_ANIMAL_LIST,
        new inquirer.Separator(),
        OPTION_BREED_ADD,
        new inquirer.Separator(),
        OPTION_CLEAR_SCREEN,
        OPTION_EXIT
      ],
      loop: false,
      pageSize: 8
    });
  }

}
