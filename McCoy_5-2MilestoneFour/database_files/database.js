import { Sequelize } from 'sequelize';
import fs from 'fs';
import { parse as csvParse } from 'csv-parse';
import { DateTime } from 'luxon';
import lineReader from 'line-reader';

import Animal, { AnimalSex } from './models/animal.js';
import Breed from './models/breed.js';
import Species from './models/species.js';
import User from './models/user.js';
import Outcome from './models/outcome.js';
import AnimalService from '../services/animal-service.js';
import SpeciesService from '../services/species-service.js';
import BreedService from '../services/breed-service.js';
import UserService from '../services/user-service.js';
import OutcomeService from '../services/outcome-service.js';

const database = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE,
  logging: false
});

// Init models
[Breed, Animal, Species, User, Outcome].forEach(m => m.setup(database));

// Create Relationships
// - Breed
Breed.belongsTo(Species, { foreignKey: { name: 'speciesId', allowNull: false } });

// - Animal
Animal.belongsTo(Breed, { foreignKey: 'breedId' });
Animal.belongsTo(Species, { foreignKey: { name: 'speciesId', allowNull: false } });
Animal.belongsTo(Outcome, { foreignKey: { name: 'outcomeTypeId' }, as: 'OutcomeType' });
Animal.belongsTo(Outcome, { foreignKey: { name: 'outcomeSubtypeId' }, as: 'OutcomeSubtype' });

/**
 * Function to get a seed file stream.
 * Each file line is piped through the csv-parser library.
 * @returns {NodeJS.WritableStream}
 */
const getCsvRecordStream = (filename) => {
  return fs
    .createReadStream(filename)
    .pipe(csvParse({
      columns: true,
      // The cast function allows us to implement some
      // value conversion logic based on the column name
      cast: (value, context) => {
        if (context.header) return value;
        switch (context.column) {
          case 'date_of_birth':
            return DateTime.fromSQL(value).toJSDate();
          case 'location_lat':
          case 'location_long':
            return +value || undefined;
          case 'outcome_type':
          case 'outcome_subtype':
            return (value || '').trim() || undefined;
          default:
            return value;
        }
      }
    }));
};

/**
 * Seeds default users.
 * @param {{spinner: import('ora').Ora?}} options If no spinner instance is sent, no progress will be reported
 * @returns {Promise<boolean>}
 */
const seedUsers = async (options) => {
  options?.spinner && options?.spinner.start('Creating default system users.');

  const user = await UserService.create({
    username: process.env.DEFAULT_USER_NAME,
    password: process.env.DEFAULT_USER_PASSWORD,
    isAdmin: true
  }, { returnPlain: true });

  if (user) {
    options?.spinner && options?.spinner.succeed();
  } else {
    options?.spinner && options?.spinner.fail('Default user could not be created.');
  }

  return user !== undefined;
};

/**
 * Seeds species, breeds, outcomes, and animals from CSV.
 * This process assumes CSV file exists with data and is correctly structured.
 * @param {{spinner: import('ora').Ora?, excludeAnimals: boolean}} options If no spinner instance is sent, no progress will be reported
 * @returns {Promise<boolean>}
 */
const seedAnimalsAndDependencies = async (options) => {
  options?.spinner && options?.spinner.start('Preparing to load records from CSV file into database.');

  // Discovering total file lines
  let totalLines = 0;
  lineReader.eachLine(process.env.DB_SEED_FILE, () => {
    totalLines++;
  });

  options?.spinner && options?.spinner.succeed().start(); // Succeed previous step and start again for next loop

  // The seed file will be analyzed to get species and breeds details
  // and insert them into the database before creating the animal itself.
  let recordsProcessed = 0;
  const batchSize = 50;

  const species = [];
  const breeds = [];
  const outcomeTypes = [];
  const outcomeSubtypes = [];
  const animalBatch = [];

  const recordStream = getCsvRecordStream(process.env.DB_SEED_FILE);
  for await (const record of recordStream) {
    recordsProcessed++;

    if (options?.spinner) {
      options.spinner.text = `Processing animal record ${recordsProcessed} of ${Math.max(totalLines - 1, 0)}...`;
    }

    // Add Species if it doesn't exist
    let recordSpecies = species.find(s => s.name === record.animal_type);
    if (!recordSpecies) {
      recordSpecies = await SpeciesService.create({ name: record.animal_type }, { returnPlain: true });

      if (!recordSpecies) break;

      species.push(recordSpecies);
    }

    // Add Breed if it doesn't exist
    let recordBreed = breeds.find(b => b.name === record.breed);
    if (!recordBreed) {
      recordBreed = await BreedService.create({
        name: record.breed,
        speciesId: recordSpecies.id
      }, { returnPlain: true });

      if (!recordBreed) break;

      breeds.push(recordBreed);
    }

    // Add Outcome Type if it doesn't exist
    let recordOutcomeType;
    if (record.outcome_type) {
      recordOutcomeType = outcomeTypes.find(s => s.name === record.outcome_type);
      if (!recordOutcomeType) {
        recordOutcomeType = await OutcomeService.create({ name: record.outcome_type }, { returnPlain: true });

        if (!recordOutcomeType) break;

        outcomeTypes.push(recordOutcomeType);
      }
    }

    // Add Outcome Subtype if it doesn't exist
    let recordOutcomeSubtype;
    if (record.outcome_subtype) {
      recordOutcomeSubtype = outcomeSubtypes.find(s => s.name === record.outcome_subtype);
      if (!recordOutcomeSubtype) {
        recordOutcomeSubtype = await OutcomeService.create({ name: record.outcome_subtype, isSubtype: true }, { returnPlain: true });

        if (!recordOutcomeSubtype) break;

        outcomeSubtypes.push(recordOutcomeSubtype);
      }
    }

    // Animal
    // - Fix sex, the import file has the sex
    //   mixed up with neutered status, let's try to
    //   make it right
    const neutered = (/neutered|spayed|castrated/gi).test(record.sex_upon_outcome);
    let sex = AnimalSex.UNKNOWN;
    if ((/\bfemale/gi).test(record.sex_upon_outcome)) {
      sex = AnimalSex.FEMALE;
    } else if ((/\bmale/gi).test(record.sex_upon_outcome)) {
      sex = AnimalSex.MALE;
    }

    // - Finally, create animal
    animalBatch.push({
      legacyId: record.animal_id,
      name: record.name,
      speciesId: recordSpecies.id,
      breedId: recordBreed.id,
      color: record.color,
      dateOfBirth: record.date_of_birth,
      locationLat: record.location_lat,
      locationLong: record.location_long,
      neutered,
      sex,
      outcomeTypeId: recordOutcomeType?.id,
      outcomeSubtypeId: recordOutcomeSubtype?.id
    });

    // If batch is full, or if this is the last iteration
    // Let's send batch to DB
    if ((animalBatch.length === batchSize) || (recordsProcessed === (totalLines - 1))) {
      if (!options?.excludeAnimals) {
        const animalBatchResult = await AnimalService.create(animalBatch, { returnPlain: true });

        // Let's bail if something failed
        if (!animalBatchResult) {
          // We need to return recordsProcessed to the proper index
          // based on where the batch failed
          recordsProcessed = recordsProcessed - batchSize;
          break;
        }
      }

      animalBatch.length = 0; // Empty batch
    }
  }

  const seedFinished = recordsProcessed === (totalLines - 1);
  if (seedFinished) {
    options?.spinner && options?.spinner.succeed(`All ${recordsProcessed} animal records loaded into the database.`);
  } else {
    options?.spinner && options?.spinner.fail(`Animal loading process failed at record ${recordsProcessed}. Please verify the file and try again.`);
  }

  recordStream.end();

  return seedFinished; // TODO: Return should be object with seeding stats/counts (to enable tests)
};

/**
 * Seeds the database when invoked.
 * This process assumes CSV file exists with data and is correctly structured.
 * @param {{spinner: import('ora').Ora?, excludeAnimals: boolean, excludeUsers: boolean}} options If no spinner instance is sent, no progress will be reported
 * @returns {Promise<boolean>}
 */
export const seed = async (options) => {
  let result = true;

  // Seed Users
  if (!options?.excludeUsers) {
    result = result && (await seedUsers(options));
  }

  // Seed Animals
  result = result && (await seedAnimalsAndDependencies(options));

  return result;
};

export default database;
