/**
 * Establishes the CR operations associated with Species Services
 *
 * Author: Larry McCoy
 */

import Species from '../db/models/species.js';
import { enhanceWhere } from '../utils/database-utils.js';

export default class SpeciesService {
  /**
   * Creates a species and returns it when successful, otherwise undefined
   * is returned.
   * @param {any} data Object containing fields for creation
   * @param {{returnPlain: boolean, throwOnError:boolean}} options
   * @returns {Promise<any>}
   */
  static async create(data, options) {
    try {
      const species = await Species.create(data);
      return options?.returnPlain ? species.get({ plain: true }) : species;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }

  /**
   * Finds species records
   * @param {any} where Object containing search criteria
   * @param {{page: number, limit: number, includeCount: boolean, returnPlain: boolean, orderBy: string}} options
   * @returns {Promise<{breeds:Array<any>, count: number}>|Promise<Array<any>>}
   */
  static async find(where, options = undefined) {
    const findOptions = {
      where: enhanceWhere(where),
      limit: options?.limit,
      offset: (options?.page ?? 0) * (options?.limit ?? 0),
      order: options?.orderBy ? [[options.orderBy]] : undefined
    };

    const result = await (options?.includeCount ? Species.findAndCountAll(findOptions) : Species.findAll(findOptions));

    return Array.isArray(result) ?
      (options?.returnPlain ? result.map((e) => e.get({ plain: true })) : result) :
      {
        species: options?.returnPlain ? result.rows.map((e) => e.get({ plain: true })) : result.rows,
        count: result.count
      };
  }
}
