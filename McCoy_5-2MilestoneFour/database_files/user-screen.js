import inquirer from 'inquirer';

export default class UserScreen {

  static async createUserAccount() {
    console.log('\nEnter username and password to create account:');
    return await inquirer.prompt([
      // Name
      {
        type: 'input',
        name: 'username',
        message: 'Username?',
        validate: (input) => {
          if (input?.trim()) {
            return true;
          } else {
            return 'Should enter a username.';
          }
        }
      },
      // Password
      {
        type: 'password',
        name: 'password',
        message: 'Password?',
        mask: '*',
        validate: (input) => {
          if (input?.trim()) {
            return true;
          } else {
            return 'Should enter a password.';
          }
        }
      }
    ]);
  }

  static async showLogin() {
    console.log('\nPlease enter your username and password to login:');
    return await inquirer.prompt([
      // Name
      {
        type: 'input',
        name: 'username',
        message: 'Username?',
        validate: (input) => {
          if (input?.trim()) {
            return true;
          } else {
            return 'Should enter a username.';
          }
        }
      },
      // Password
      {
        type: 'password',
        name: 'password',
        message: 'Password?',
        mask: '*',
        validate: (input) => {
          if (input?.trim()) {
            return true;
          } else {
            return 'Should enter a password.';
          }
        }
      }
    ]);
  }

}
