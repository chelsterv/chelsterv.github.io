import Breed from "../db/models/breed.js";
import Species from "../db/models/species.js";

export default class BreedService {
  /**
   * Creates an breed and returns it when successful, otherwise undefined
   * is returned.
   * @param {any} data Object containing fields for creation
   * @param {{returnPlain: boolean, throwOnError: boolean, includeSpecies: boolean}} options
   * @returns {Promise<any>}
   */
  static async create(data, options = undefined) {
    try {
      const breed = await Breed.create(data);
      if (options?.includeSpecies) {
        await breed.reload({ include: Species });
      }
      return options?.returnPlain ? breed.get({ plain: true }) : breed;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }
}
