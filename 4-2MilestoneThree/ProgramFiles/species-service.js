import Species from "../db/models/species.js";

export default class SpeciesService {
  /**
   * Creates a species and returns it when successful, otherwise undefined
   * is returned.
   * @param {any} data Object containing fields for creation
   * @param {{returnPlain: boolean, throwOnError:boolean}} options
   * @returns {Promise<any>}
   */
  static async create(data, options = undefined) {
    try {
      const species = await Species.create(data);
      return options?.returnPlain ? species.get({ plain: true }) : species;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }
}
