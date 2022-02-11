import Animal from "../db/models/animal.js";
import Breed from "../db/models/breed.js";
import Species from "../db/models/species.js";
import {DateTime} from "luxon";

export default class AnimalService {

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
          await result.reload({ include: Species })
        };
        return options?.returnPlain ? result.get({ plain: true }) : result;
      }
    } catch (err) {
      if (options?.throwOnError) throw err;
      return undefined;
    }
  }
  /**
   * Conducts Read and display of database records
   * @returns 
   */
  static async query(){
    return await Animal.findAll({limit:10,include:[Species, Breed]});
  }
  static displayRecord(animal){
    const now = DateTime.now();
    const dob = DateTime.fromJSDate(animal.dateOfBirth);

    const diff = now.diff(dob, ["years", "months", "days"])
    let timespan = `${Math.trunc(diff.years)} year(s)`;
    if (diff.years < 1) {
      timespan = `${Math.trunc(diff.months)} month(s)`;
    }

    return [
      animal.id,
      animal.name,
      `${dob.toFormat('MMM dd, yyyy')} (${timespan})`,
      animal.Species.name,
      animal.Breed.name
    ];
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
