/**
 * Establishes the CR operations testing for Outcom Services
 *
 * Author: Larry McCoy
 */

import { expect } from 'chai';
import { Model } from 'sequelize';
import sinon from 'sinon';
import database, { seed } from '../../src/db/database.js';
import Outcome from '../../src/db/models/outcome.js';
import OutcomeService from '../../src/services/outcome-service.js';

//  Unit test for the read method of the Outcome Service functionality
describe.only('OutcomeService', () => {

  describe('find', () => {

    // Seed the database for Outcome Service read outcome method unit test
    before(async () => {
      await database.sync({ force: true });
      await seed();
    });

    it('finds all outcomes in DB (without using criteria)', async () => {
      const outcome = await OutcomeService.find();

      expect(outcome).to.be.lengthOf(7);
      expect(outcome[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds outcome with single criteria', async () => {
      const outcome = await OutcomeService.find({ name: 'Adoption' }, { orderBy: 'id' });

      expect(outcome).to.be.lengthOf(1);

      expect(outcome[0].id).to.equal(3);
      expect(outcome[0].name).to.equal('Adoption');
      expect(outcome[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('finds outcomes returning plain objects', async () => {
      const outcome = await OutcomeService.find({ name: 'Adoption' }, { returnPlain: true });

      expect(outcome).to.be.lengthOf(1);
      expect(outcome[0] instanceof Model).to.equal(false); // Instance of Model
    });

    it('finds all outcomes but limits the amount of records returned', async () => {
      const outcome = await OutcomeService.find(undefined, { limit: 5, orderBy: 'id' });

      expect(outcome).to.be.lengthOf(5);
      expect(outcome[0].id).to.equal(1);
    });

    it('finds all outcomes as plain objects including count of total records matching criteria', async () => {
      const results = await OutcomeService.find(undefined, { limit: 5, orderBy: 'id', includeCount: true, returnPlain: true });

      expect(results.outcome).to.be.lengthOf(5);
      expect(results.count).to.equal(10);
      expect(results.outcome[0].id).to.equal(1);
      expect(results.outcome[0] instanceof Model).to.equal(false); // Instance of Model
    });

    it('finds all outcome in DB (without using criteria)', async () => {
      const outcome = await OutcomeService.find();

      expect(outcome).to.be.lengthOf(7);
      expect(outcome[0] instanceof Model).to.equal(true); // Instance of Model
    });

    it('throws error when DB had issues', (done) => {
      // Force an error
      const stub = sinon.stub(Outcome, 'findAll').rejects('faked error');

      OutcomeService.find(undefined, { throwOnError: true }).catch((err) => {
        expect(err.name).to.equal('faked error');

        stub.restore();
        done();
      });
    });
  });
});
