/**
 * Establishes the CRUD operations testing for Species Services
 * Executes testing against database for error messaging
 *
 * Author: Larry McCoy
 */

import { expect } from 'chai';
import { Model } from 'sequelize';
import database, { seed } from '../../src/db/database.js';
//import Species from '../../src/db/models/species.js';
import SpeciesService from '../../src/services/species-service.js';

//  Unit test for the read method of the Species Service functionality
describe('SpeciesService', () => {

  describe('find', () => {

    // Seed the database for Species Service read species method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('finds all species in DB (without using criteria)', async () => {
      const species = await SpeciesService.find();

      expect(species).to.be.lengthOf(2);
      expect(species[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds species with single criteria', async () => {
      const species = await SpeciesService.find({ name: 'Dog' }, { orderBy: 'id' });

      expect(species).to.be.lengthOf(1);

      expect(species[0].id).to.equal(2);
      expect(species[0].name).to.equal('Dog');
      expect(species[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds outcomes returning plain objects', async () => {
      const species = await SpeciesService.find({ name: 'Dog' }, { returnPlain: true });

      expect(species).to.be.lengthOf(1);
      expect(species[0] instanceof Model).to.equal(false); // Instance of Model
    });

    it('finds all outcomes but limits the amount of records returned', async () => {
      const species = await SpeciesService.find(undefined, { limit: 5, orderBy: 'id' });

      expect(species).to.be.lengthOf(2);
      expect(species[0].id).to.equal(1);
    });

    it('finds all outcomes as plain objects including count of total records matching criteria', async () => {
      const results = await SpeciesService.find(undefined, { limit: 5, orderBy: 'id', includeCount: true, returnPlain: true });

      expect(results.species).to.be.lengthOf(2);
      expect(results.count).to.equal(2);
      expect(results.species[0].id).to.equal(1);
      expect(results.species[0] instanceof Model).to.equal(false); // Instance of Model
    });
  });

  // Unit test for the create method of the Species Service functionality
  describe('create', () => {

    // Seed the database for Species Service create species method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    // Establish specie object for create breed method unit test
    const newSpecies = {
      name: 'Strange Species',
    };

    const assertSpecies = (species, newSpecies) => {
      expect(species.name).to.equal(newSpecies.name);
    };

    it('creates a single species and returns the created Model instance', async () => {
      const species = await SpeciesService.create(newSpecies);

      assertSpecies(species, newSpecies);

      expect(species.Species).to.equal(undefined); // Not included by default

      expect(species instanceof Model).to.equal(true); // Instance of Model
    });

    it('creates a single species and returns the created Plain Object instance', async () => {
      const species = await SpeciesService.create(newSpecies, { returnPlain: true });

      assertSpecies(species, newSpecies);

      expect(species.Species).to.equal(undefined); // Not included by default

      expect(species instanceof Model).to.equal(false); // Instance of Model
    });
  });
});
