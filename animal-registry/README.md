# Animal Shelter Registry

## Technology Stack

* Javascript (Node.js v16.13.2 and up)
* Sequelize (ORM)
* Sqlite Database

This project was built using plain vanilla javascript. It uses several libraries, but most predominant ones are:

* `sequelize` - ORM for Sqlite database
* `inquirer` - Console input fields and menus
* `table` - Pretty print of tabular data
* `bcrypt` - Encryption provider
* `mocha` - Unit test framework

Several environment variables are required to be configured. This project contains a `.env_smaple` that can be used to generate a `.env` required for execution. Unit tests will automatically use the `tests/.env`.

> Some of the values in these files may be sensitive. Never share environment files on source repositories. Make sure to add them to your `.gitignore` file.

* `DB_STORAGE` - Sqlite database file location
* `DB_SEED_FILE` - Import file to seed database location
* `DEFAULT_USER_NAME` - Default user username
* `DEFAULT_USER_PASSWORD` - (sensitive) Default user password
* `SECURITY_PASSWORD_ENCRYPT` - Flag to enable and disable password encryption.

## 
Quick Start

Setup the project (active internet connection required):
```sh
npm ci

# Alternatively npm install can also be executed

```

Setup and initialize database (uses configured import file):
```sh
npm run db:setup
```

Start the system:
```sh
npm start
```

Run unit tests:
```sh
npm test
```

## Unit Tests & Test Coverage

The test script configured in this project automatically generates a code coverage report at runtime (in the console), and also a full-fledged HTML report in the `coverage` folder: `coverage/index.html`.
