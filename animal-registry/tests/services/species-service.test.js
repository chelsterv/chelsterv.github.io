/**
 * Establishes the CRUD operations testing for Species Services
 * Executes testing against database for error messaging
 *
 * Author: Larry McCoy
 */

import { expect } from 'chai';
import { Model } from 'sequelize';
import database, { seed } from '../../src/db/database.js';
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
  });
});
