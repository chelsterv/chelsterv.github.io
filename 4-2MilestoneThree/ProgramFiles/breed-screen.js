import inquirer from 'inquirer';
import SpeciesService from '../services/species-service.js';

export default class BreedScreen {

  static async showAdd() {
    console.log('\nPlease enter the following details to add a new breed:');
    const breed = await inquirer.prompt([
      // Species
      {
        type: 'list',
        name: 'speciesId',
        message: 'What species?',
        choices: async () => {
          return (await SpeciesService.find(undefined, { orderBy: 'name' }))
            .map(s => ({ name: s.name, value: `${s.id}` }));
        }
      },
      // Name
      {
        type: 'input',
        name: 'name',
        message: 'Breed Name?',
        validate: (input) => {
          if (input?.trim()) {
            return true;
          } else {
            return 'Should enter a breed name.';
          }
        }
      },
    ]);

    return breed;
  }

}
