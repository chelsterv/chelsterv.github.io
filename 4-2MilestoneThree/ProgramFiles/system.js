import chalk from 'chalk';
import AnimalScreen from './screens/animal-screen.js';
import BreedScreen from './screens/breed-screen.js';
import MainMenuScreen from './screens/main-menu-screen.js';
import UserScreen from './screens/user-screen.js';
import AnimalService from './services/animal-service.js';
import BreedService from './services/breed-service.js';
import UserService from './services/user-service.js';
import { Alert } from './utils/display-utils.js';

class System {

  constructor() {
    this.user = undefined;
  }

  /**
   * Run system main menu
   * @param {boolean?} nonPersistent Flag that allows us to run menu once instead of a loop
   */
  async start(nonPersistent = false) {
    if (!this.user) {
      const login = await UserScreen.showLogin();
      this.user = await UserService.authenticate(login.username, login.password);

      if (!this.user) {
        Alert.error('Failed to authenticate with specified username and password.');
      }
    }

    let exit = false;
    while (this.user && !exit) {
      const option = (await MainMenuScreen.show()).option;

      switch (option) {
        case MainMenuScreen.MENU_OPTIONS.ANIMAL_ADD:
          await this.handleAnimalAdd();
          break;
        case MainMenuScreen.MENU_OPTIONS.ANIMAL_LIST:
          await this.handleAnimalList();
          break;
        case MainMenuScreen.MENU_OPTIONS.BREED_ADD:
          await this.handleBreedAdd();
          break;
        case MainMenuScreen.MENU_OPTIONS.USER_ADD:
          await this.handleUserAdd();
          break;
        case MainMenuScreen.MENU_OPTIONS.CLEAR_SCREEN:
          console.clear();
          break;
        case MainMenuScreen.MENU_OPTIONS.EXIT:
          this.user = undefined;
          Alert.info('Thanks for using Animal Shelter Registry. Good bye!', 'Logged Off');
          exit = true;
          break;
      }

      if (nonPersistent) break;
    }
  }

  /**
   * Handles the data gathering and creation of an animal
   */
  async handleAnimalAdd() {
    const animalData = await AnimalScreen.showAddUpdate();
    if (animalData) {
      // Detect new breed from breedId / breedName
      if (animalData.breedId === 0 && animalData.breedName) {
        const newBreed = await BreedService.create({ name: animalData.breedName, speciesId: animalData.speciesId });
        animalData.breedId = newBreed.id;
        delete animalData.breedName;
      }
      const animal = await AnimalService.create(animalData, { includeSpecies: true, returnPlain: true });
      if (animal) {
        Alert.success(`New ${animal.Species.name.toLowerCase()} (${animal.name}) has been successfully registered.`);
      } else {
        Alert.error('There was a problem registering the animal. Please try again later.');
      }
    } else {
      Alert.info('Animal registration was cancelled by the user.');
    }
  }

  /**
   * Handles the animal list screen
   */
  async handleAnimalList() {
    const nav = {
      page: 0,
      maxPages: 0,
      limit: 10,
      count: 0,
      navOption: AnimalScreen.NAV_OPTIONS.NEXT,
      filter: undefined
    };

    let result;
    let exit = false;
    do {
      result = await AnimalService.find(nav.filter, {
        page: nav.page,
        limit: nav.limit,
        includeCount: true,
        includeSpecies: true,
        includeBreed: true,
        includeOutcome: true,
        returnPlain: true
      });
      nav.count = result.count;

      // Is there some results? or is there a filter active?
      if (nav.filter || nav.count) {
        nav.maxPages = Math.trunc(nav.count / nav.limit);
        if (nav.count - (nav.maxPages * nav.limit) > 0) {
          // If there's a remainder we need to add an
          // additional page
          nav.maxPages++;
        }

        const refreshTable = ![
          AnimalScreen.NAV_OPTIONS.DELETE_PAGE,
          AnimalScreen.NAV_OPTIONS.UPDATE
        ].includes(nav.navOption);

        if (refreshTable) {
          // Display results table and navigation options
          console.log(); // Empty line before table
          console.log(AnimalService.getDisplayTable(result.animals, { includeHeader: true, raw: false }));
        }

        const response = await AnimalScreen.showListNavigation(
          nav.filter,
          result.animals,
          nav.page,
          nav.maxPages,
          nav.limit,
          nav.count,
          nav.navOption,
          !refreshTable
        );

        nav.navOption = response.navOption;

        switch(nav.navOption) {
          case AnimalScreen.NAV_OPTIONS.GOTO:
            if (!Number.isNaN(response.page)) {
              nav.page = Math.min(Math.max(response.page - 1, 0), nav.maxPages - 1);
            }
            break;
          case AnimalScreen.NAV_OPTIONS.UPDATE:
            if (response.update) {
              // Detect new breed from breedId / breedName
              if (response.update.breedId === 0 && response.update.breedName) {
                const newBreed = await BreedService.create({ name: response.update.breedName, speciesId: response.update.speciesId });
                response.update.breedId = newBreed.id;
                delete response.update.breedName;
              }
              const updated = await AnimalService.update(response.update);
              if (updated) {
                Alert.success(`Successfully updated the selected animal. Use the ${chalk.green('⭮  Refresh Page')} option or keep navigating the list to get updated results.`);
              } else {
                Alert.error('There was a problem updating the selected animal. Please try again.');
              }
            } else {
              Alert.info('No animal was selected for update, or the user cancelled the operation.');
            }
            break;
          case AnimalScreen.NAV_OPTIONS.DELETE_PAGE:
            if (response.delete?.length) {
              const deleted = await AnimalService.delete(response.delete);
              if (deleted) {
                Alert.success(`Successfully deleted ${deleted} animal(s). Use the ${chalk.green('⭮  Refresh Page')} option or keep navigating the list to get updated results.`);
              } else {
                Alert.error('There was a problem deleting the selected animal(s). Please try again.');
              }
            } else {
              Alert.info('No animals were selected for deletion, or the user cancelled the operation.');
            }
            break;
          case AnimalScreen.NAV_OPTIONS.FIRST:
            nav.page = 0;
            break;
          case AnimalScreen.NAV_OPTIONS.LAST:
            nav.page = nav.maxPages - 1;
            break;
          case AnimalScreen.NAV_OPTIONS.PREV:
          case AnimalScreen.NAV_OPTIONS.NEXT: {
            const dir = nav.navOption === AnimalScreen.NAV_OPTIONS.PREV ? -1 : 1;
            nav.page = Math.min(Math.max(nav.page + dir, 0), nav.maxPages - 1);
            break;
          }
          case AnimalScreen.NAV_OPTIONS.FILTER:
            nav.filter = response.filter;
            nav.page = 0;
        }

        // If selected navOption is stop or general count is less than the limit
        // we need to exit this loop
        exit = (nav.navOption === AnimalScreen.NAV_OPTIONS.EXIT); // || (!nav.filter && !nav.count);
      } else {
        Alert.warn('It seems there are no animals in the database at this moment.');
        exit = true;
      }
    } while (!exit);
  }

  /**
   * Handles the addition of a new breed
   */
  async handleBreedAdd() {
    const breedData = await BreedScreen.showAdd();
    const breed = await BreedService.create(breedData, { includeSpecies: true, returnPlain: true });
    if (breed) {
      Alert.success(`New breed (${breed.name}) has been added.`);
    } else {
      Alert.error('There was a problem adding the new breed. Please try again later.');
    }
  }

  /**
   * Handles the addition of a new user
   */
  async handleUserAdd() {
    const userData = await UserScreen.createUserAccount();
    const user = await UserService.create(userData, { returnPlain: true });
    if (user) {
      Alert.success(`New user (${user.username}) has been added.`);
    } else {
      Alert.error('There was a problem adding the new user. Please try again later.');
    }
  }

}

export const system = new System();
