// index.js
import database, { seed } from './src/db/database.js';
import { system } from './src/system.js';
import ora from 'ora';

let cmd = '';
if (process.argv.length > 2) {
  cmd = process.argv[2].trim().toLocaleLowerCase();
}

const dbSetup = (cmd === '--db-setup');

let spinner;
if (dbSetup) {
  spinner = ora().start('Preparing setup database...');
}

// Let's initialize the database first then start the system
database.sync(dbSetup ? { force: true } : undefined).then(async () => {
  if (dbSetup) {
    spinner.succeed('Database schema successfully updated.');
    const seedSuccess = await seed({ spinner });
    if (seedSuccess) {
      spinner.succeed('Database successfully setup.');
    } else {
      spinner.warn('Database setup finished with some errors.');
    }

    console.log(); // Extra empty line
  } else {
    system.start();
  }
});
