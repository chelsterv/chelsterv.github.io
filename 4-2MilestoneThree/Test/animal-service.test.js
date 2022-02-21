/**
 * Establishes the CRUD operations testing for Animal Services
 * Executes testing against database for error messaging
 *
 * Author: Larry McCoy
 */

import { expect } from 'chai';
import { DateTime } from 'luxon';
import { Model } from 'sequelize';
import sinon from 'sinon';
import database, { seed } from '../../src/db/database.js';
import Animal from '../../src/db/models/animal.js';
import AnimalService from '../../src/services/animal-service.js';

//  Unit test for the read method of the Animal Service functionality
describe('AnimalService', () => {

  describe('find', () => {

    // Seed the database for Animal Service read animal method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('finds all animals in DB (without using criteria)', async () => {
      const animals = await AnimalService.find();

      expect(animals).to.be.lengthOf(10);
      expect(animals[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds animals with single criteria', async () => {
      const animals = await AnimalService.find({ color: 'White' }, { orderBy: 'id' });

      expect(animals).to.be.lengthOf(2);

      expect(animals[0].id).to.equal(1);
      expect(animals[0].color).to.equal('White');
      expect(animals[0].sex).to.equal('Male');
      expect(animals[0].breedId).to.equal(1);
      expect(animals[0].Breed).to.equal(undefined);
      expect(animals[0] instanceof Model).to.equal(true); // Instance of Model

      expect(animals[1].id).to.equal(9);
      expect(animals[1].color).to.equal('White');
      expect(animals[1].sex).to.equal('Female');
      expect(animals[1].breedId).to.equal(7);
      expect(animals[1].Breed).to.equal(undefined);
      expect(animals[1] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds animals with multiple criteria', async () => {
      const animals = await AnimalService.find({ color: 'White', sex: 'Male' });

      expect(animals).to.be.lengthOf(1);

      expect(animals[0].id).to.equal(1);
      expect(animals[0].color).to.equal('White');
      expect(animals[0].sex).to.equal('Male');
      expect(animals[0].breedId).to.equal(1);
      expect(animals[0].Breed).to.equal(undefined);
      expect(animals[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds animals returning plain objects', async () => {
      const animals = await AnimalService.find({ color: 'White' }, { returnPlain: true });

      expect(animals).to.be.lengthOf(2);
      expect(animals[0] instanceof Model).to.equal(false); // Instance of Model
    });

    it('finds animals including related entities', async () => {
      const animals = await AnimalService.find({ color: 'White' }, { includeBreed: true, includeSpecies: true, includeOutcome: true });

      expect(animals[0].id).to.equal(1);
      expect(animals[0].color).to.equal('White');
      expect(animals[0].sex).to.equal('Male');
      expect(animals[0].breedId).to.equal(1);
      expect(animals[0].Breed.id).to.equal(1);
      expect(animals[0].speciesId).to.equal(1);
      expect(animals[0].Species.id).to.equal(1);
      expect(animals[0].outcomeTypeId).to.equal(1);
      expect(animals[0].OutcomeType.id).to.equal(1);
      expect(animals[0].outcomeSubtypeId).to.equal(2);
      expect(animals[0].OutcomeSubtype.id).to.equal(2);
    });

    it('finds all animals but limits the amount of records returned', async () => {
      const animals = await AnimalService.find(undefined, { limit: 5, orderBy: 'id' });

      expect(animals).to.be.lengthOf(5);
      expect(animals[0].id).to.equal(1);
    });

    it('finds all animals but limits the amount of records returned starting at a specific page (zero index based)', async () => {
      const animals = await AnimalService.find(undefined, { limit: 5, page: 1, orderBy: 'id' });

      expect(animals).to.be.lengthOf(5);
      expect(animals[0].id).to.equal(6);
    });

    it('finds animals all animals but limits the amount of records returned, including count of total records matching criteria', async () => {
      const results = await AnimalService.find(undefined, { limit: 5, orderBy: 'id', includeCount: true });

      expect(results.animals).to.be.lengthOf(5);
      expect(results.count).to.equal(10);
      expect(results.animals[0].id).to.equal(1);
      expect(results.animals[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds all animals as plain objects including count of total records matching criteria', async () => {
      const results = await AnimalService.find(undefined, { limit: 5, orderBy: 'id', includeCount: true, returnPlain: true });

      expect(results.animals).to.be.lengthOf(5);
      expect(results.count).to.equal(10);
      expect(results.animals[0].id).to.equal(1);
      expect(results.animals[0] instanceof Model).to.equal(false); // Instance of Model
    });

    it('returns undefined when DB had issues', async () => {
      const stub = sinon.stub(Animal, 'findAll').rejects('faked error');

      const animals = await AnimalService.find();

      expect(animals).to.equal(undefined);

      stub.restore();
    });

    it('throws error when DB had issues', (done) => {
      // Force an error
      const stub = sinon.stub(Animal, 'findAll').rejects('faked error');

      AnimalService.find(undefined, { throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });

    });
  });

  //  Unit test for the create method of the Animal Service functionality
  describe('create', () => {

    // Seed the database for Animal Service create animal method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed({ excludeAnimals: true }); // No animals will be inserted inserted
    });

    const dateOfBirth = DateTime.fromSQL('2020-02-02').toJSDate();
    const newAnimals = [
      // Animal 1
      {
        legacyId: 'T1',
        name: 'Animal 1',
        speciesId: 1, // Cat
        breedId: 1,
        color: 'Black',
        dateOfBirth: dateOfBirth,
        locationLat: undefined,
        locationLong: undefined,
        neutered: true,
        sex: 'Male'
      },
      // Animal 2
      {
        legacyId: 'T2',
        name: 'Animal 2',
        speciesId: 1, // Cat
        breedId: 1,
        color: 'White',
        dateOfBirth: dateOfBirth,
        locationLat: -97.3408780722188,
        locationLong: 156.767857142857,
        neutered: false,
        sex: 'Female'
      }
    ];

    /**
     * This function will be re-used to do the common
     * animal assertions.
     * @param {any} animal
     * @param {any} newAnimal
     */
    const assertAnimal = (animal, newAnimal) => {
      expect(animal.id).to.be.greaterThan(0); // It must have an ID not specified in creation data
      expect(animal.legacyId).to.equal(newAnimal.legacyId);
      expect(animal.name).to.equal(newAnimal.name);
      expect(animal.speciesId).to.equal(newAnimal.speciesId);
      expect(animal.breedId).to.equal(newAnimal.breedId);
      expect(animal.color).to.equal(newAnimal.color);
      expect(animal.dateOfBirth.getTime()).to.equal(newAnimal.dateOfBirth.getTime());
      expect(animal.locationLat).to.equal(newAnimal.locationLat);
      expect(animal.locationLong).to.equal(newAnimal.locationLong);
      expect(animal.neutered).to.equal(newAnimal.neutered);
      expect(animal.sex).to.equal(newAnimal.sex);
    };

    it('creates a single animal and returns the created Model instance', async () => {
      const animal = await AnimalService.create(newAnimals[0]);

      assertAnimal(animal, newAnimals[0]);

      expect(animal.Species).to.equal(undefined); // Not included by default

      expect(animal instanceof Model).to.equal(true); // Instance of Model
    });

    it('creates a single animal and returns the created Model instance including related Species', async () => {
      const animal = await AnimalService.create(newAnimals[0], { includeSpecies: true });

      assertAnimal(animal, newAnimals[0]);

      expect(animal.Species.id).to.equal(1);
      expect(animal.Species.name).to.equal('Cat');

      expect(animal instanceof Model).to.equal(true); // Instance of Model
    });

    it('creates a single animal and returns the created Plain Object instance', async () => {
      const animal = await AnimalService.create(newAnimals[0], { returnPlain: true });

      assertAnimal(animal, newAnimals[0]);

      expect(animal.Species).to.equal(undefined); // Not included by default

      expect(animal instanceof Model).to.equal(false); // Instance of Model
    });

    it('creates a single animal and returns the created Plain Object instance including related Species', async () => {
      const animal = await AnimalService.create(newAnimals[0], { returnPlain: true, includeSpecies: true });

      assertAnimal(animal, newAnimals[0]);

      expect(animal.Species.id).to.equal(1);
      expect(animal.Species.name).to.equal('Cat');

      expect(animal instanceof Model).to.equal(false); // Instance of Model
    });

    it('creates a multiple animals and returns the created Model instance', async () => {
      const animals = await AnimalService.create(newAnimals);

      animals.forEach((animal, idx) => {
        assertAnimal(animal, newAnimals[idx]);

        expect(animal.Species).to.equal(undefined); // Not included by default

        expect(animal instanceof Model).to.equal(true); // Instance of Model
      });
    });

    it('creates a multiple animals and returns the created Plain Object instance including related Species', async () => {
      const animals = await AnimalService.create(newAnimals, { returnPlain: true, includeSpecies: true });

      animals.forEach((animal, idx) => {
        assertAnimal(animal, newAnimals[idx]);

        expect(animal.Species.id).to.equal(1);
        expect(animal.Species.name).to.equal('Cat');

        expect(animal instanceof Model).to.equal(false); // Instance of Model
      });
    });

    it('returns undefined when DB had issues', async () => {
      // Force an error
      const stub = sinon.stub(Animal, 'create').rejects('faked error');

      const animal = await AnimalService.create(newAnimals[0]);

      expect(animal).to.equal(undefined);

      stub.restore();
    });

    it('throws error when DB had issues', (done) => {
      // Force an error
      const stub = sinon.stub(Animal, 'create').rejects('faked error');

      AnimalService.create(newAnimals[0], { throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });

    });

  });

  //  Unit test for the update method of the Animal Service functionality
  describe('update', () => {

    // Seed the database for Animal Service Update animal method unit test
    beforeEach(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('updates an animal', async () => {
      const id = 1;
      const newName = 'Has Name';
      const newColor = 'Transparent';

      const originalAnimal = (await AnimalService.find({ id }, { returnPlain: true }))[0];
      const update = await AnimalService.update({ id, name: newName, color: newColor });
      const updatedAnimal = (await AnimalService.find({ id }, { returnPlain: true }))[0];

      expect(update).to.equal(true);

      expect(originalAnimal.name).to.equal('');
      expect(originalAnimal.color).to.equal('White');
      expect(originalAnimal.sex).to.equal('Male');

      expect(updatedAnimal.name).to.equal(newName);
      expect(updatedAnimal.color).to.equal(newColor);
      expect(updatedAnimal.sex).to.equal('Male'); // Remains unchanged as expected
    });

    it('returns an false when DB had issues', async () => {
      const id = 1;
      const newName = 'Has Name';
      const newColor = 'Transparent';

      const stub = sinon.stub(Animal, 'update').rejects('faked error');

      const originalAnimal = (await AnimalService.find({ id }, { returnPlain: true }))[0];
      const update = await AnimalService.update({ id, name: newName, color: newColor });
      const updatedAnimal = (await AnimalService.find({ id }, { returnPlain: true }))[0];

      expect(update).to.equal(false);

      expect(originalAnimal.name).to.equal('');
      expect(originalAnimal.color).to.equal('White');
      expect(originalAnimal.sex).to.equal('Male');

      expect(updatedAnimal.name).to.equal('');
      expect(updatedAnimal.color).to.equal('White');
      expect(updatedAnimal.sex).to.equal('Male');

      stub.restore();
    });

    it('throws error when DB had issues', (done) => {
      const id = 1;
      const newName = 'Has Name';
      const newColor = 'Transparent';

      const stub = sinon.stub(Animal, 'update').rejects('faked error');

      AnimalService.update({ id, name: newName, color: newColor }, { throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });
    });

  });

  //  Unit test for the delete method of the Animal Service functionality
  describe('delete', () => {

    // Seed the database for Animal Service delete animal method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('deletes a single animal', async () => {
      const deleted = await AnimalService.delete(1); // Returns number of records deleted
      const confirmDelete = await AnimalService.find({ id: 1});

      expect(deleted).to.equal(1);
      expect(confirmDelete).to.be.lengthOf(0);
    });

    it('deletes multiple animals', async () => {
      const deleted = await AnimalService.delete([2, 3, 4, 5]); // Returns number of records deleted
      const confirmDelete = await AnimalService.find({ id: [2, 3, 4, 5] });

      expect(deleted).to.equal(4);
      expect(confirmDelete).to.be.lengthOf(0);
    });

    it('returns undefined when DB had issues', async () => {
      // Force an error
      const stub = sinon.stub(Animal, 'destroy').rejects('faked error');

      const deleted = await AnimalService.delete(6);
      const confirmDelete = await AnimalService.find({ id: 6 });

      expect(deleted).to.deep.equal(undefined);
      expect(confirmDelete).to.be.lengthOf(1);

      stub.restore();
    });

    it('throws error when DB had issues', (done) => {
      // Force an error
      const stub = sinon.stub(Animal, 'destroy').rejects('faked error');

      AnimalService.delete(6, { throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });

    });
  });

  //  Unit test for the color method of the Animal Service functionality
  describe('getColors', () => {

    // Seed the database for Animal Service getting animal color method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('extracts colors from Animals table and returns them as received from DB', async () => {
      // Force an out of order result set
      // The in-memory DB is returning ordered values always
      const stub = sinon.stub(Animal, 'findAll').resolves([
        { color: 'White' },
        { color: 'Black' },
        { color: '' },
        { color: 'Brown' }
      ]);

      const colors = await AnimalService.getColors();

      expect(colors).to.be.lengthOf(3);
      expect(colors).to.deep.equal(['White', 'Black', 'Brown']);

      stub.restore();
    });

    it('extracts colors from Animals table and returns them sorted', async () => {
      const colors = await AnimalService.getColors({ sort: true });

      expect(colors).to.be.lengthOf(3);
      expect(colors).to.deep.equal(['Black', 'Brown', 'White']);
    });

    it('returns an empty array when DB had issues', async () => {
      // Force an error
      const stub = sinon.stub(Animal, 'findAll').rejects('faked error');

      const colors = await AnimalService.getColors();

      expect(colors).to.be.lengthOf(0);
      expect(colors).to.deep.equal([]);

      stub.restore();
    });

    it('throws error when DB had issues', (done) => {
      // Force an error
      const stub = sinon.stub(Animal, 'findAll').rejects('faked error');

      AnimalService.getColors({ throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });

    });

  });

  //  Unit test for the sex method of the Animal Service functionality
  describe('getSexes', () => {

    // Seed the database for Animal Service getting animal sex method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('extracts sex values and returns them as received from DB', async () => {
      // Force an out of order result set
      // The in-memory DB is returning ordered values always
      const stub = sinon.stub(Animal, 'findAll').resolves([
        { sex: 'Unknown' },
        { sex: 'Female' },
        { color: undefined },
        { sex: 'Male' }
      ]);

      const sexes = await AnimalService.getSexes();

      expect(sexes).to.be.lengthOf(3);
      expect(sexes).to.deep.equal(['Unknown', 'Female', 'Male']);

      stub.restore();
    });

    it('extracts sex values and returns them sorted', async () => {
      const sexes = await AnimalService.getSexes({ sort: true });

      expect(sexes).to.be.lengthOf(3);
      expect(sexes).to.deep.equal(['Female', 'Male', 'Unknown']);
    });

    it('returns an empty array when DB had issues', async () => {
      // Force an error
      const stub = sinon.stub(Animal, 'findAll').rejects('faked error');

      const sexes = await AnimalService.getSexes();

      expect(sexes).to.be.lengthOf(0);
      expect(sexes).to.deep.equal([]);

      stub.restore();
    });

    it('throws error when DB had issues', (done) => {
      // Force an error
      const stub = sinon.stub(Animal, 'findAll').rejects('faked error');

      AnimalService.getSexes({ throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });

    });

  });

  //  Unit test for the display table and paging method of the Animal Service functionality
  describe('getDisplayTable', () => {

    // Seed the database for Animal Service getting animal table and paging method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('generates a structure with header and details of type string (displayable with console.log)', async () => {
      const animals = await AnimalService.find(undefined, { includeBreed: true, includeSpecies: true, includeOutcome: true });
      const table = AnimalService.getDisplayTable(animals, { includeHeader: true });

      expect(typeof table).to.equal('string');
    });

    it('generates a 2 dimensional array with header and details of animals', async () => {
      const animals = await AnimalService.find(undefined, { includeBreed: true, includeSpecies: true, includeOutcome: true, returnPlain: true });
      const table = AnimalService.getDisplayTable(animals, { includeHeader: true, raw: true });

      expect(Array.isArray(table)).to.equal(true);
      expect(Array.isArray(table[0])).to.equal(true);
    });

  });

});
