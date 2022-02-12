import chalk from 'chalk';
import get from 'lodash.get';
import { Model, Op } from 'sequelize';
import { table } from 'table';
import Animal from '../db/models/animal.js';
import Breed from '../db/models/breed.js';
import Species from '../db/models/species.js';
import {
  transformDobAndAge,
  transformLocation,
  transformSexNeutered,
  transformTypeBreedColor,
  transformOutcomes
} from '../utils/animal-utils.js';
import Outcome from '../db/models/outcome.js';
import { enhanceWhere, SEARCH_EMPTY } from '../utils/database-utils.js';
import { DisplayRecordConfig } from '../utils/display-utils.js';

/**
 * Conditionally transforms a string using a function. When passthrough is true value is passed-through.
 * @param {string} value Value to be formatted
 * @param {Function} transformFunc Transform function to be used on value
 * @param {boolean} passthrough Flag that short-circuits the format operation, resulting on a value pass-through
 * @returns {string}
 */
const transform = (value, transformFunc, passthrough) => !passthrough && (typeof transformFunc === 'function') ? transformFunc(value) : value;

export default class AnimalService {
  /**
   * Private configuration used to generate headers and records for tabular view.
   * Each element defines: header, path to data in model[, format function, alignment, default, default format function]
   * @private
   */
  static #DISPLAY_CONFIG = [
    new DisplayRecordConfig('ID', 'id', chalk.green, 'right'),
    new DisplayRecordConfig('Legacy ID', 'legacyId', undefined, 'center', SEARCH_EMPTY, chalk.gray),
    new DisplayRecordConfig('Name', 'name', undefined, 'left', SEARCH_EMPTY, chalk.gray),
    new DisplayRecordConfig('Type / Breed / Color', ['Species.name', 'Breed.name', 'color'], transformTypeBreedColor),
    new DisplayRecordConfig('DoB / Age', 'dateOfBirth', transformDobAndAge),
    new DisplayRecordConfig('Sex', ['sex', 'neutered'], transformSexNeutered, 'center'),
    new DisplayRecordConfig('Outcome', ['OutcomeType.name', 'OutcomeSubtype.name'], transformOutcomes, 'center', SEARCH_EMPTY, chalk.gray),
    new DisplayRecordConfig('Location', ['locationLat', 'locationLong'], transformLocation, 'left', SEARCH_EMPTY, chalk.gray)
  ];

  /**
   * Creates an animal and returns it when successful, otherwise undefined
   * is returned unless throwOnError is set to `true`.
   * @param {Object|Array} data Object containing fields for creation
   * @param {{returnPlain: boolean, throwOnError: boolean, includeSpecies: boolean}?} options
   * @returns {Promise<any>}
   */
  static async create(data, options = undefined) {
    try {
      const isBulk = Array.isArray(data);
      let result = await (isBulk ? Animal.bulkCreate(data) : Animal.create(data));
      if (isBulk) {
        if (options?.includeSpecies) {
          for (const element of result) {
            await element.reload({ include: Species });
          }
        }
        return options?.returnPlain ? result.map((e) => e.get({ plain: true })) : result;
      } else {
        if (options?.includeSpecies) {
          await result.reload({ include: Species });
        }
        return options?.returnPlain ? result.get({ plain: true }) : result;
      }
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }

  /**
   * Updates an animal record
   * @param {any} data Animal data to be updated
   * @param {{throwOnError: boolean}} options
   * @returns {Promise<boolean>}
   */
  static async update(data, options = undefined) {
    try {
      let result = await Animal.update(data, { where: { id: data.id } });
      return result[0] === 1;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return false;
    }
  }

  /**
   * Deletes one or more animals based on sent ids.
   * @param {Array<number>|number} id Id or ids to be deleted
   * @param {{throwOnError: boolean}?} options
   * @returns {Promise<number>}
   */
  static async delete(id, options) {
    const ids = Array.isArray(id) ? id : [id];
    try {
      return await Animal.destroy({ where: {
        id: { [Op.in]: ids }
      }});
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }

  /**
   * Finds animal records
   * @param {any} where Animal object containing search criteria
   * @param {{includeSpecies: boolean, includeBreed: boolean, includeOutcome: boolean, page: number, limit: number, includeCount: boolean, returnPlain: boolean, orderBy: string, throwOnError: boolean}} options
   * @returns {Promise<{animals:Array<any>, count: number}>|Promise<Array<any>>}
   */
  static async find(where, options = undefined) {
    try {
      const include = [];
      if (options?.includeSpecies) include.push(Species);
      if (options?.includeBreed) include.push(Breed);
      if (options?.includeOutcome) {
        include.push({ model: Outcome, as: 'OutcomeType' });
        include.push({ model: Outcome, as: 'OutcomeSubtype' });
      }

      const findOptions = {
        where: enhanceWhere(where),
        limit: options?.limit,
        offset: (options?.page ?? 0) * (options?.limit ?? 0),
        include: include.length ? include : undefined,
        order: options?.orderBy ? [[options.orderBy]] : undefined,
        subQuery: true
      };

      const result = await (options?.includeCount ? Animal.findAndCountAll(findOptions) : Animal.findAll(findOptions));

      return Array.isArray(result) ?
        (options?.returnPlain ? result.map((e) => e.get({ plain: true })) : result) :
        {
          animals: options?.returnPlain ? result.rows.map((e) => e.get({ plain: true })) : result.rows,
          count: result.count
        };
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }

  /**
   * Returns a static header to be used in tabular display
   * @param {boolean} raw
   * @returns {Array<string>}
   */
  static getDisplayHeader(raw) {
    return this.#DISPLAY_CONFIG.map((col) => transform(col.header, chalk.bold, raw));
  }

  /**
   * Creates a data structure that can be used to display tabular data
   * @param {any} animal Animal object to be converted into data array (for tabular display)
   * @param {boolean} raw
   * @returns {Array<string>}
   */
  static getDisplayRecord(animal, raw = false) {
    const plainAnimal = (animal instanceof Model) ? animal.get({ plain: true }) : animal;
    return this.#DISPLAY_CONFIG.map((col) => {
      // Resolve record all data paths
      const val = Array.isArray(col.dataPath) ?
        col.dataPath.map((path) => get(plainAnimal, path, '')) :
        get(plainAnimal, col.dataPath, '');

      return (Array.isArray(val) ? (val.filter((v) => v).length === 0) : (val === '')) && col.defaultData && !raw ?
        transform(col.defaultData, col.defaultDataTransform, raw) :
        transform(val, col.dataTransform, raw);
    });
  }

  /**
   * Gets an display structure
   * @param {Array<any>} animals
   * @param {{includeHeader: boolean, raw: boolean}} options
   * @returns {string|Array<Array<any>>}
   */
  static getDisplayTable(animals, options) {
    const animalsTable = [];
    const columnsConfig = this.#DISPLAY_CONFIG.map((col) => ({ alignment: col.align }));

    // Add header if required
    if (options?.includeHeader) {
      animalsTable.push(AnimalService.getDisplayHeader(options?.raw));
    }

    // Add table detail
    animalsTable.push(...animals.map((animal) => AnimalService.getDisplayRecord(animal, options?.raw)));

    return options?.raw ? animalsTable : table(animalsTable, { columns: columnsConfig });
  }

  /**
   * Returns list of all colors available in the Animals table.
   * @param {{sort: boolean, throwOnError: boolean}?} options
   * @returns {Promise<Array<string>>}
   */
  static async getColors(options = undefined) {
    try {
      const colors = (await Animal.findAll({
        attributes: ['color'],
        group: ['color']
      })).map(a => a.color).filter(v => v);
      return options?.sort ? colors.sort() : colors;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return [];
    }
  }

  /**
   * Returns list of all sexes available in the Animals table.
   * @param {{sort: boolean, throwOnError: boolean}?} options
   * @returns {Promise<Array<string>>}
   */
  static async getSexes(options = undefined) {
    try {
      const sexes = (await Animal.findAll({
        attributes: ['sex'],
        group: ['sex']
      })).map(a => a.sex).filter(v => v);
      return options?.sort ? sexes.sort() : sexes;
    } catch (err) {
      if (options?.throwOnError) throw err;
      return [];
    }
  }

}
