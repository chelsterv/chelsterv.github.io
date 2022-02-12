import inquirer from 'inquirer';
import chalk from 'chalk';
import inquirerDatePrompt from 'inquirer-date-prompt';
import inquireAutocompletePrompt from 'inquirer-autocomplete-prompt';
import AnimalService from '../services/animal-service.js';
import BreedService from '../services/breed-service.js';
import SpeciesService from '../services/species-service.js';
import OutcomeService from '../services/outcome-service.js';
import { ORANGE_RGB } from '../utils/display-utils.js';
import { SEARCH_EMPTY } from '../utils/database-utils.js';

inquirer.registerPrompt('date', inquirerDatePrompt);
inquirer.registerPrompt('autocomplete', inquireAutocompletePrompt);

export default class AnimalScreen {

  static NAV_OPTIONS = {
    FIRST: 'first',
    PREV: 'prev',
    NEXT: 'next',
    LAST: 'last',
    GOTO: 'goto',
    EXIT: 'exit',
    UPDATE: 'update',
    DELETE_PAGE: 'delete_page',
    DELETE_FILTER: 'delete_filter', // TODO: Implement delete filtered?
    REFRESH: 'refresh',
    FILTER: 'filter'
  };

  static FILTER_OPTIONS = {
    BY_ID: 'id',
    BY_LEGACY_ID: 'legacyId',
    BY_NAME: 'name',
    BY_COLOR: 'color',
    BY_SEX: 'sex',
    BY_SPECIES: 'speciesId',
    BY_BREED: 'breedId',
    RESET: 'reset',
    EXIT: 'exit'
  };

  static FIELD_LABELS = {
    [this.FILTER_OPTIONS.BY_ID]: 'ID',
    [this.FILTER_OPTIONS.BY_LEGACY_ID]: 'Legacy ID',
    [this.FILTER_OPTIONS.BY_NAME]: 'Name',
    [this.FILTER_OPTIONS.BY_COLOR]: 'Color',
    [this.FILTER_OPTIONS.BY_SEX]: 'Sex',
    [this.FILTER_OPTIONS.BY_SPECIES]: 'Species',
    [this.FILTER_OPTIONS.BY_BREED]: 'Species and Breed'
  };

  /**
   * Displays the add or update form. When record is sent,
   * form wording will be adjusted for an update context
   * @param {any?} record Optional record to be updated
   * @returns {Promise<any>}
   */
  static async showAddUpdate(record) {
    // Get all colors from Animal table
    const colors = (await AnimalService.getColors({ sort: true }));

    console.log(`\nPlease enter the following details to ${record ? 'update an' : 'register a new'} animal:`);
    const response = await inquirer.prompt([
      // Species
      {
        type: 'list',
        name: 'speciesId',
        message: 'What species?',
        choices: async () => {
          return (await SpeciesService.find(undefined, { orderBy: 'name' }))
            .map(s => ({ name: s.name, value: `${s.id}` }));
        },
        default: record?.speciesId ? `${record?.speciesId}` : undefined
      },
      // Breed
      {
        type: 'autocomplete',
        name: 'breedId',
        message: 'Type of breed?',
        source: async (answers, input) => [
          { name: chalk.green('Add New Breed...'), value: 0 },
          ...(await BreedService.find(
            { speciesId: answers.speciesId, name: input ? `%${input}%` : undefined },
            { orderBy: 'name' }
          )).map(b => ({ name: b.name, value: `${b.id}` }))
        ],
        suggestOnly: false,
        loop: false,
        default: record?.breedId ? `${record?.breedId}` : undefined
      },
      // Breed: Name
      {
        type: 'input',
        name: 'breedName',
        message: 'New Breed Name?',
        validate: (input) => {
          if (input?.trim()) {
            return true;
          } else {
            return 'Should enter a breed name.';
          }
        },
        when: (answers) => answers.breedId === 0
      },
      // Name
      {
        type: 'input',
        name: 'name',
        message: 'Animal Name?',
        validate: (input) => {
          if (input?.trim()) {
            return true;
          } else {
            return 'Should enter an animal name.';
          }
        },
        default: record?.name
      },
      // Color
      {
        type: 'autocomplete',
        name: 'color',
        message: 'Color?',
        source: (_answers, input) => {
          return input ? colors.filter(c => c.toLowerCase().includes(input?.toLowerCase())) : colors;
        },
        suggestOnly: true,
        loop: false,
        default: record?.color
      },
      // Sex
      {
        type: 'list',
        name: 'sex',
        message: 'Sex?',
        choices: async () => {
          return await AnimalService.getSexes({ sort: true });
        },
        default: record?.sex
      },
      // Neutered
      {
        type: 'confirm',
        name: 'neutered',
        message: 'Has the animal been neutered?',
        default: record?.neutered ?? false,
      },
      // Date of Birth
      {
        type: 'date',
        name: 'dateOfBirth',
        message: 'Date of Birth? (use arrow keys)',
        format: { month: 'short', hour: undefined, minute: undefined },
        default: record?.dateOfBirth,
      },
      // Location Available
      {
        type: 'confirm',
        name: 'locationAvailable',
        message: 'Do you have the animal\'s location (latitude and longitude)?',
        default: (record?.locationLat !== undefined) || (record?.locationLong !== undefined)
      },
      // Location Latitude
      {
        type: 'input',
        name: 'locationLat',
        message: 'Location Latitude?',
        transformer: (input, _answers, options) => {
          if (options.isFinal) {
            return !(+input || undefined) ? 'Not provided' : +input;
          }
          return input;
        },
        filter: (input) => +input || undefined,
        default: record?.locationLat,
        when: (answers) => answers.locationAvailable
      },
      // Location Longitude
      {
        type: 'input',
        name: 'locationLong',
        message: 'Location Longitude?',
        transformer: (input, _answers, options) => {
          if (options.isFinal) {
            return !(+input || undefined) ? 'Not provided' : +input;
          }
          return input;
        },
        filter: (input) => +input || undefined,
        default: record?.locationLong,
        when: (answers) => answers.locationAvailable
      },
      // Outcomes Available
      {
        type: 'confirm',
        name: 'outcomesAvailable',
        message: 'Are there any outcomes to set for this animal?',
        default: (record?.outcomeTypeId !== undefined) || (record?.outcomeSubtypeId !== undefined)
      },
      // Outcome Type
      {
        type: 'autocomplete',
        name: 'outcomeTypeId',
        message: 'Outcome Type?',
        source: async (_answers, input) => [
          { name: chalk.rgb(...ORANGE_RGB)('No Outcome Type'), value: undefined },
          ...(await OutcomeService.find(
            { isSubtype: false, name: input ? `%${input}%` : undefined },
            { orderBy: 'name' }
          )).map(s => ({ name: s.name, value: `${s.id}` }))
        ],
        loop: false,
        default: `${record?.outcomeTypeId}`,
        when: (answers) => answers.outcomesAvailable
      },
      // Outcome Type
      {
        type: 'autocomplete',
        name: 'outcomeSubtypeId',
        message: 'Outcome Subtype?',
        source: async (_answers, input) => [
          { name: chalk.rgb(...ORANGE_RGB)('No Outcome Subtype'), value: undefined },
          ...(await OutcomeService.find(
            { isSubtype: true, name: input ? `%${input}%` : undefined },
            { orderBy: 'name' }
          )).map(s => ({ name: s.name, value: `${s.id}` }))
        ],
        loop: false,
        default: `${record?.outcomeSubtypeId}`,
        // Show question when outcome available and a previous type was selected
        when: (answers) => answers.outcomesAvailable && answers.outcomeTypeId
      },
      // Final confirm
      {
        type: 'list',
        name: 'confirm',
        message: `Are you sure you want to ${record ? 'update' : 'create'} this animal?`,
        choices: [
          { name: `Yes, ${record ? 'Update' : 'Create'}`, value: true },
          { name: `No, Cancel ${record ? 'Update' : 'Creation'}`, value: false }
        ],
        default: true
      }
    ]);

    // Fix some fields before returning
    if (record) {
      response.id = record.id;
      response.legacyId = record.legacyId;
    }
    response.color = response.color.trim() || undefined;

    return response.confirm ? response : undefined;
  }

  /**
   * Displays the navigation menu to manage animals
   * @param {any} filter Current filter
   * @param {Array<any>} records Array of records being displayed
   * @param {number} currentPage
   * @param {number} maxPages
   * @param {number} recordsPerPage Records displayed per page (also called limit)
   * @param {number} totalRecords Total records found in the DB regardless of records being displayed
   * @param {string} defaultNavOption Default navigation menu option
   * @param {boolean} showRefresh Will show refresh page when `true`
   * @returns {Promise<any>}
   */
  static async showListNavigation(filter, records, currentPage, maxPages, recordsPerPage, totalRecords, defaultNavOption, showRefresh) {
    const choices = [];
    if (currentPage > 0) {
      choices.push({ name: `${chalk.green('⏮')}  First Page`, value: this.NAV_OPTIONS.FIRST });
      choices.push({ name: `${chalk.green('⏴')}  Prev Page`, value: this.NAV_OPTIONS.PREV });
    }
    if (currentPage < maxPages - 1) {
      choices.push({ name: `${chalk.green('⏵')}  Next Page`, value: this.NAV_OPTIONS.NEXT });
      choices.push({ name: `${chalk.green('⏭')}  Last Page`, value: this.NAV_OPTIONS.LAST });
    }
    if (showRefresh) {
      choices.push({ name: `${chalk.green('⭮')}  Refresh Page`, value: this.NAV_OPTIONS.REFRESH });
    }
    choices.push({ name: `${chalk.blueBright('✱')}  ${filter ? 'Update' : 'Setup'} Filter...`, value: this.NAV_OPTIONS.FILTER });
    if (maxPages > 1) {
      choices.push({ name: `${chalk.blueBright('↷')}  Go To Page`, value: this.NAV_OPTIONS.GOTO });
    }

    if (records.length > 0) {
      choices.length && choices.push(new inquirer.Separator());
      choices.push({ name: `${chalk.blue('✎')}  Update Animal from Page...`, value: this.NAV_OPTIONS.UPDATE });
      choices.push({ name: `${chalk.red('⨉')}  Delete Animal(s) from Page...`, value: this.NAV_OPTIONS.DELETE_PAGE });
    }

    console.log(); // Empty line main menu
    const response = await inquirer.prompt([
      // Navigation options
      {
        type: 'list',
        name: 'navOption',
        message: `Page ${currentPage + 1}: ${filter ? chalk.blue('Filtered ') : ''}Record(s) ${(currentPage * recordsPerPage) + (records.length ? 1 : 0)} - ${(currentPage * recordsPerPage) + records.length} of ${totalRecords} - Select an option?`,
        choices: [
          ...choices,
          new inquirer.Separator(),
          { name: `${chalk.rgb(...ORANGE_RGB)('🠈')} Back to Main Menu`, value: this.NAV_OPTIONS.EXIT }
        ],
        loop: false,
        default: defaultNavOption,
        pageSize: (choices.length + 3)
      },
      // Page
      {
        type: 'input',
        name: 'page',
        message: `Which Page (1 to ${maxPages})?`,
        filter: (input) => (input.trim() === '') ? (currentPage + 1) : +input,
        when: (answers) => answers.navOption === this.NAV_OPTIONS.GOTO
      }
    ]);

    // Handle options that require more input from user
    switch(response.navOption) {
      case this.NAV_OPTIONS.UPDATE:
        response.update = await this.showUpdateList(records);
        if (response.update) {
          response.update = await this.showAddUpdate(response.update);
        }
        break;
      case this.NAV_OPTIONS.DELETE_PAGE: {
        const deleteResponse = await this.showDeleteList(records);
        // Transfer data to original response
        response.delete = (deleteResponse.deleteConfirm && deleteResponse.delete.length) ? deleteResponse.delete : undefined;
        break;
      }
      case this.NAV_OPTIONS.FILTER:
        response.filter = await this.showFilterOptions(filter);
        break;
    }

    return response;
  }

  static async showUpdateList(records) {
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'update',
        message: 'Select which animal you which to update?',
        choices: async () => [
          { name: chalk.rgb(...ORANGE_RGB)('No Animal'), value: undefined },
          ...records.map((a) => ({ name: `${a.id}${a.legacyId ? ` - ${a.legacyId}` : ''} - ${a.name || chalk.gray('<no name>')} (${a.Species.name}: ${a.Breed.name})`, value: a.id }))
        ],
        loop: false
      }
    ]);

    return records.find((a) => a.id === response.update);
  }

  /**
   * Shows options for deleting one or more animals
   * @param {Array<any>} records
   * @returns {Promise<{delete:Array<number>, deleteConfirm:boolean}>}
   */
  static async showDeleteList(records) {
    return await inquirer.prompt([
      // Delete List
      {
        type: 'checkbox',
        name: 'delete',
        message: 'Select which animal(s) you which to delete?',
        choices: async () => {
          return records.map(s => ({ name: `${s.id}${s.legacyId ? ` - ${s.legacyId}` : ''} - ${s.name || chalk.gray('<no name>')} (${s.Species.name}: ${s.Breed.name})`, value: s.id }));
        },
        loop: false
      },
      // Delete confirm
      {
        type: 'confirm',
        name: 'deleteConfirm',
        message: (answers) => `Are you sure you want to delete the${answers.delete.length > 1 ? ` ${answers.delete.length}` : ''} selected animal(s)?`,
        default: false,
        when: (answers) => answers.delete.length
      }
    ]);
  }

  /**
   * Shows filtering options
   * @param {any} filter Filter object to be used as default
   * @returns {Promise<any>}
   */
  static async showFilterOptions(filter) {
    const choices = [];

    Object.keys(this.FILTER_OPTIONS)
      .filter((key) => key.startsWith('BY_'))
      .forEach((key) => {
        choices.push({ name: `${chalk.blueBright('✱')}  Filter by ${this.FIELD_LABELS[this.FILTER_OPTIONS[key]]}${filter?.[this.FILTER_OPTIONS[key]] !== undefined ? ' (active)' : ''}`, value: this.FILTER_OPTIONS[key] });
      });

    let defaultFilterOption;
    if (filter) {
      if (filter.breedId) {
        defaultFilterOption = this.FILTER_OPTIONS.BY_BREED;
      } else if (filter.speciesId) {
        defaultFilterOption = this.FILTER_OPTIONS.BY_SPECIES;
      } else {
        defaultFilterOption = Object.keys(filter)[0];
      }

      choices.push(new inquirer.Separator());
      choices.push({ name: `${chalk.red('⊝')}  Reset Filter`, value: this.FILTER_OPTIONS.RESET });
    }
    choices.push(new inquirer.Separator());
    choices.push({ name: `${chalk.rgb(...ORANGE_RGB)('🠈')} Back to List (no changes)`, value: this.FILTER_OPTIONS.EXIT });

    const response = await inquirer.prompt([
      // Filter Option
      {
        type: 'list',
        name: 'filterOption',
        message: 'Filter options (only one can be active at a time):',
        choices,
        default: defaultFilterOption,
        loop: false,
        pageSize: choices.length
      },
      // Value
      {
        type: 'input',
        name: 'filterValue',
        message: (answers) => `Enter the value to filter by "${this.FIELD_LABELS[answers.filterOption]}":`,
        default: (answers) => {
          // Check if we need to display empty placeholder
          return (filter?.[answers.filterOption] === '') ?
            SEARCH_EMPTY :
            filter?.[answers.filterOption];
        },
        when: (answers) => [
          this.FILTER_OPTIONS.BY_ID,
          this.FILTER_OPTIONS.BY_LEGACY_ID,
          this.FILTER_OPTIONS.BY_NAME,
          this.FILTER_OPTIONS.BY_COLOR
        ].includes(answers.filterOption)
      },
      // Sex
      {
        type: 'list',
        name: 'sex',
        message: 'Sex?',
        choices: async () => {
          return [
            { name: chalk.rgb(...ORANGE_RGB)('No Sex'), value: undefined },
            ...(await AnimalService.getSexes({ sort: true })).map((sex) => ({ name: sex, value: sex }))
          ];
        },
        default: filter?.sex,
        when: (answers) => (answers.filterOption === this.FILTER_OPTIONS.BY_SEX)
      },
      // Species
      {
        type: 'list',
        name: 'speciesId',
        message: 'What species?',
        choices: async () => {
          return [
            { name: chalk.rgb(...ORANGE_RGB)('No Species'), value: undefined },
            ...(await SpeciesService.find(undefined, { orderBy: 'name' }))
              .map(s => ({ name: s.name, value: `${s.id}` }))
          ];
        },
        default: filter?.speciesId,
        when: (answers) => (answers.filterOption === this.FILTER_OPTIONS.BY_SPECIES) || (answers.filterOption === this.FILTER_OPTIONS.BY_BREED)
      },
      // Breed
      {
        type: 'autocomplete',
        name: 'breedId',
        message: 'What Breed?',
        source: async (answers, input) => [
          { name: chalk.rgb(...ORANGE_RGB)('No Breed'), value: undefined },
          ...(await BreedService.find(
            { speciesId: answers.speciesId, name: input ? `%${input}%` : undefined },
            { orderBy: 'name' }
          )).map(b => ({ name: b.name, value: `${b.id}` }))
        ],
        suggestOnly: false,
        loop: false,
        when: (answers) => (answers.filterOption === this.FILTER_OPTIONS.BY_BREED) && answers.speciesId
      }
    ]);

    let newFilter;
    if ((response.filterOption !== this.FILTER_OPTIONS.RESET) && (response.filterOption !== this.FILTER_OPTIONS.EXIT)) {
      switch(response.filterOption) {
        case this.FILTER_OPTIONS.BY_SPECIES:
          if (response.speciesId) {
            newFilter = {
              [this.FILTER_OPTIONS.BY_SPECIES]: response.speciesId
            };
          }
          break;
        case this.FILTER_OPTIONS.BY_BREED:
          if (response.breedId) {
            newFilter = {
              [this.FILTER_OPTIONS.BY_SPECIES]: response.speciesId,
              [this.FILTER_OPTIONS.BY_BREED]: response.breedId
            };
          }
          break;
        case this.FILTER_OPTIONS.BY_SEX:
          if (response.sex) {
            newFilter = {
              [this.FILTER_OPTIONS.BY_SEX]: response.sex
            };
          }
          break;
        default:
          // Check if name value is place-holder to change to empty
          let filterValue = response.filterValue.trim() || undefined;
          if (filterValue !== undefined) {
            newFilter = {
              [response.filterOption]: filterValue
            };
          }
          break;
      }
    }

    return (response.filterOption === this.FILTER_OPTIONS.EXIT) ? filter : newFilter;
  }

}
