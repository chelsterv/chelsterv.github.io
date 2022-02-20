import { expect } from 'chai';
import { Model } from 'sequelize';
import sinon from 'sinon';
import database, { seed } from '../../src/db/database.js';
import Breed from '../../src/db/models/breed.js';
import BreedService from '../../src/services/breed-service.js';

describe('BreedService', () => {

  describe('find', () => {

    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('finds all breeds in DB (without using criteria)', async () => {
      const breeds = await BreedService.find();

      expect(breeds).to.be.lengthOf(7);
      expect(breeds[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds breeds with single criteria', async () => {
      const breeds = await BreedService.find({ name: 'Pit Bull' }, { orderBy: 'id' });

      expect(breeds).to.be.lengthOf(1);

      expect(breeds[0].id).to.equal(5);
      expect(breeds[0].name).to.equal('Pit Bull');
      expect(breeds[0].speciesId).to.equal(2);
      expect(breeds[0].Species).to.equal(undefined);
      expect(breeds[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds breeds returning plain objects', async () => {
      const breeds = await BreedService.find({ name: 'Pit Bull' }, { returnPlain: true });

      expect(breeds).to.be.lengthOf(1);
      expect(breeds[0] instanceof Model).to.equal(false);
    });

    xit('finds breeds including related entities', async () => {
      const breeds = await BreedService.find({ name: 'Pit Bull' }, { includeSpecies: true });

      expect(breeds[0].id).to.equal(5);
      expect(breeds[0].name).to.equal('Pit Bull');
      expect(breeds[0].speciesId).to.equal(2);
      expect(breeds[0].Species.id).to.equal(2);
      expect(breeds[0].Species.name).to.equal('Dog');
    });

    it('finds all breeds but limits the amount of records returned', async () => {
      const breeds = await BreedService.find(undefined, { limit: 5, orderBy: 'id' });

      expect(breeds).to.be.lengthOf(5);
      expect(breeds[0].id).to.equal(1);
    });

    it('finds all breeds but limits the amount of records returned starting at a specific page (zero index based)', async () => {
      const breeds = await BreedService.find(undefined, { limit: 5, page: 1, orderBy: 'id' });

      expect(breeds).to.be.lengthOf(2);
      expect(breeds[0].id).to.equal(6);
    });

    it('finds breeds but limits the amount of records returned, including count of total records matching criteria', async () => {
      const results = await BreedService.find(undefined, { limit: 5, orderBy: 'id', includeCount: true });

      expect(results.breeds).to.be.lengthOf(5);
      expect(results.count).to.equal(7);
      expect(results.breeds[0].id).to.equal(1);
      expect(results.breeds[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds all breeds as plain objects including count of total records matching criteria', async () => {
      const results = await BreedService.find(undefined, { limit: 5, orderBy: 'id', includeCount: true, returnPlain: true });

      expect(results.breeds).to.be.lengthOf(5);
      expect(results.count).to.equal(7);
      expect(results.breeds[0].id).to.equal(1);
      expect(results.breeds[0] instanceof Model).to.equal(false); // Instance of Model
    });

    it('returns undefined when DB had issues', async () => {
      const stub = sinon.stub(Breed, 'findAll').rejects('faked error');

      const breeds = await BreedService.find();

      expect(breeds).to.equal(undefined);

      stub.restore();
    });

    it('throws error when DB had issues', (done) => {
      // Force an error
      const stub = sinon.stub(Breed, 'findAll').rejects('faked error');

      BreedService.find(undefined, { throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });

    });
  });

  describe('create', () => {

    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    const newBreed = {
      name: 'Strange Breed',
      speciesId: 2
    };

    const assertBreed = (breed, newBreed) => {
      expect(breed.id).to.be.greaterThan(0); // It must have an ID not specified in creation data
      expect(breed.name).to.equal(newBreed.name);
      expect(breed.speciesId).to.equal(newBreed.speciesId);
    };

    it('creates a single breed and returns the created Model instance', async () => {
      const breed = await BreedService.create(newBreed);

      assertBreed(breed, newBreed);

      expect(breed.Species).to.equal(undefined); // Not included by default

      expect(breed instanceof Model).to.equal(true); // Instance of Model
    });

    it('creates a single breed and returns the created Model instance including related Species', async () => {
      const breed = await BreedService.create(newBreed, { includeSpecies: true });

      assertBreed(breed, newBreed);

      expect(breed.Species.id).to.equal(2);
      expect(breed.Species.name).to.equal('Dog');

      expect(breed instanceof Model).to.equal(true); // Instance of Model
    });

    it('creates a single breed and returns the created Plain Object instance', async () => {
      const breed = await BreedService.create(newBreed, { returnPlain: true });

      assertBreed(breed, newBreed);

      expect(breed.Species).to.equal(undefined); // Not included by default

      expect(breed instanceof Model).to.equal(false); // Instance of Model
    });

    it('creates a single breed and returns the created Plain Object instance including related Species', async () => {
      const breed = await BreedService.create(newBreed, { returnPlain: true, includeSpecies: true });

      assertBreed(breed, newBreed);

      expect(breed.Species.id).to.equal(2);
      expect(breed.Species.name).to.equal('Dog');

      expect(breed instanceof Model).to.equal(false); // Instance of Model
    });

    it('returns undefined when DB had issues', async () => {
      // Force an error
      const stub = sinon.stub(Breed, 'create').rejects('faked error');

      const breed = await BreedService.create(newBreed);

      expect(breed).to.equal(undefined);

      stub.restore();
    });

    it('throws error when DB had issues', (done) => {
      // Force an error
      const stub = sinon.stub(Breed, 'create').rejects('faked error');

      BreedService.create(newBreed, { throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });

    });
  });
});
