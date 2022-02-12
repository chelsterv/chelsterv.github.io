import Breed from '../db/models/breed.js';
import Species from '../db/models/species.js';
import { enhanceWhere } from '../utils/database-utils.js';

export default class BreedService {
  /**
   * Creates an breed and returns it when successful, otherwise undefined
   * is returned.
   * @param {any} data Object containing fields for creation
   * @param {{returnPlain: boolean, throwOnError: boolean, includeSpecies: boolean}} options
   * @returns {Promise<any>}
   */
  static async create(data, options) {
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

  /**
   * Finds breed records
   * @param {any} where Object containing search criteria
   * @param {{includeSpecies: boolean, page: number, limit: number, includeCount: boolean, returnPlain: boolean, orderBy: string}} options
   * @returns {Promise<{breeds:Array<any>, count: number}>|Promise<Array<any>>}
   */
  static async find(where, options = undefined) {
    const include = [];
    if (options?.includeSpecies) include.push(Species);

    const findOptions = {
      where: enhanceWhere(where),
      limit: options?.limit,
      offset: (options?.page ?? 0) * (options?.limit ?? 0),
      include: include.length ? include : undefined,
      order: options?.orderBy ? [[options.orderBy]] : undefined
    };

    const result = await (options?.includeCount ? Breed.findAndCountAll(findOptions) : Breed.findAll(findOptions));

    return Array.isArray(result) ?
      (options?.returnPlain ? result.map((e) => e.get({ plain: true })) : result) :
      {
        breeds: options?.returnPlain ? result.rows.map((e) => e.get({ plain: true })) : result.rows,
        count: result.count
      };
  }
}
