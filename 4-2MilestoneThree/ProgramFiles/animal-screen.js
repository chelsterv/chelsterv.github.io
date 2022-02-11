import inquirer from 'inquirer';
import { Op } from 'sequelize';
import inquirerDatePrompt from 'inquirer-date-prompt';
import inquireAutocompletePrompt from 'inquirer-autocomplete-prompt'
import Breed from '../db/models/breed.js';
import Species from '../db/models/species.js';
import AnimalService from '../services/animal-service.js';

inquirer.registerPrompt('date', inquirerDatePrompt);
inquirer.registerPrompt('autocomplete', inquireAutocompletePrompt);

export default class AnimalScreen {

  static async showAdd() {
    // Get all colors from Animal table
    const colors = (await AnimalService.getColors({ sort: true }));

    console.log(`\nPlease enter the following details to register a new animal:`);
    const animal = await inquirer.prompt([
      // Species
      {
        type: 'list',
        name: 'speciesId',
        message: 'What species?',
        choices: async () => {
          return (await Species.findAll({
            order: [ ['name'] ]
          })).map(s => ({ name: s.name, value: s.id }));
        }
      },
      // Breed
      {
        type: 'autocomplete',
        name: 'breedId',
        message: `Type of breed?`,
        source: async (answers, input) => {
          return (await Breed.findAll({
            where: {
              speciesId: answers.speciesId,
              name: { [Op.like]: `%${input || ''}%` }
            },
            order: [ ['name'] ]
          })).map(s => ({ name: s.name, value: s.id }));
        },
        suggestOnly: false,
        loop: false
      },
      // Name
      {
        type: 'input',
        name: 'name',
        message: `Name?`,
        validate: (input) => {
          if (input?.trim()) {
            return true;
          } else {
            return 'Should enter a name.';
          }
        }
      },
      // Color
      {
        type: 'autocomplete',
        name: 'color',
        message: `Color?`,
        source: (_answers, input) => {
          return input ? colors.filter(c => c.toLowerCase().includes(input?.toLowerCase())) : colors;
        },
        suggestOnly: true,
        loop: false
      },
      // Sex
      {
        type: 'list',
        name: 'sex',
        message: 'Sex?',
        choices: async () => {
          return await AnimalService.getSexes({ sort: true });
        }
      },
      // Neutered
      {
        type: 'confirm',
        name: 'neutered',
        message: `Has the animal been neutered?`,
        default: false
      },
      // Date of Birth
      {
        type: 'date',
        name: 'dateOfBirth',
        message: `Date of Birth? (use arrow keys)`,
        format: { month: "short", hour: undefined, minute: undefined }
      },
      // Location Available
      {
        type: 'confirm',
        name: 'locationAvailable',
        message: `Do you have the animal's location (latitude and longitude)?`,
        default: false
      },
      // Location Latitude
      {
        type: 'input',
        name: 'locationLat',
        message: `Location Latitude?`,
        transformer: (input, _answers, options) => {
          if (options.isFinal) {
            return !(+input || undefined) ? 'Not provided' : +input;
          }
          return input;
        },
        filter: (input) => +input || undefined,
        when: (answers) => answers.locationAvailable
      },
      // Location Longitude
      {
        type: 'input',
        name: 'locationLong',
        message: `Location Longitude?`,
        transformer: (input, _answers, options) => {
          if (options.isFinal) {
            return !(+input || undefined) ? 'Not provided' : +input;
          }
          return input;
        },
        filter: (input) => +input || undefined,
        when: (answers) => answers.locationAvailable
      }
    ]);

    // console.log('animal', animal);
    // throw new Error();

    // Fix some fields before returning
    animal.color = animal.color.trim() || undefined;

    return animal;
  }

}
