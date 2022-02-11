import { table } from 'table';
import AnimalScreen from './screens/animal-screen.js';
import MainMenuScreen from './screens/main-menu-screen.js';
import AnimalService from './services/animal-service.js';
import BreedService from './services/breed-service.js';

export default class System {

  /**
   * Run system main menu
   * @param {boolean?} nonPersistent Flag that allows us to run menu once instead of a loop
   */
  async start(nonPersistent = false) {
    // console.clear();

    let exit = false;
    do {
      const option = (await MainMenuScreen.show()).option;

      switch (option) {
        case MainMenuScreen.options.ANIMAL_ADD:
          await this.handleAnimalAdd();
          break;
          case MainMenuScreen.options.ANIMAL_LIST:
            await this.handleAnimalList();
            break;
        case MainMenuScreen.options.CLEAR_SCREEN:
          console.clear();
          break;
        case MainMenuScreen.options.EXIT:
          console.log('\nGood bye!');
          exit = true;
          break;
      }
    } while (!exit || nonPersistent);
  }

  /**
   * Handles the data gathering and creation of an animal
   */
  async handleAnimalAdd() {
    const animalData = await AnimalScreen.showAdd();
    if (animalData) {
      if (typeof animalData.breedId === 'string'){
        const newBreed = await BreedService.create({
          name: animalData.breedId, 
          speciesId: animalData.speciesId
        });
        animalData.breedId = newBreed.id;
      }
      const animal = await AnimalService.create(animalData, { includeSpecies: true, returnPlain: true });
      if (animal) {
        console.log(`New ${animal.Species.name.toLowerCase()} (${animal.name}) has been registered.\n`);
      } else {
        console.log(`There was a problem registering the animal. Please try again.\n`);
      }
    }
  }

  /**
   * Handles data gathering and display in table format
   */
  async handleAnimalList() {
    const list = await AnimalService.query();
    const view = [];

    view.push(['id','Name','DoB (age)','Species','Breed']);
    list.forEach(animal => { 
      view.push(AnimalService.displayRecord(animal));
    });

    console.log(table(view));
  }

}
