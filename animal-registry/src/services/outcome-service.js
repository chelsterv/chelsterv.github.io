import Outcome from '../db/models/outcome.js';
import { enhanceWhere } from '../utils/database-utils.js';

export default class OutcomeService {
  /**
   * Creates an outcome and returns it when successful, otherwise undefined
   * is returned.
   * @param {any} data Object containing fields for creation
   * @param {{returnPlain: boolean, throwOnError:boolean}} options
   * @returns {Promise<any>}
   */
  static async create(data, options) {
    try {
      const outcome = await Outcome.create(data);
      return options?.returnPlain ? outcome.get({ plain: true }) : outcome;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }

  /**
   * Finds outcome records
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

    const result = await (options?.includeCount ? Outcome.findAndCountAll(findOptions) : Outcome.findAll(findOptions));

    return Array.isArray(result) ?
      (options?.returnPlain ? result.map((e) => e.get({ plain: true })) : result) :
      {
        outcomes: options?.returnPlain ? result.rows.map((e) => e.get({ plain: true })) : result.rows,
        count: result.count
      };
  }
}
