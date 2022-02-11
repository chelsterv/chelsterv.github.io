import { expect } from 'chai';
import { DateTime } from 'luxon';
import { Model } from 'sequelize';
import sinon from 'sinon';
import database, { seed } from '../src/db/database.js';
import Animal from '../src/db/models/animal.js';
import AnimalService from "../src/services/animal-service.js";

describe('AnimalService', () => {

  before(async () => {
    // Some tests data assertions will depend on the data imported
    // from '/tests/data/test.csv' file, if the file is changed in
    // any way it may break some test
    await database.sync();
    await seed();
  });

  describe('create', () => {
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

  describe('getColors', () => {

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

  describe('getSexes', () => {

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

});
