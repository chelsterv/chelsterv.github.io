import chalk from 'chalk';
import { DateTime } from 'luxon';

/**
 * Transforms a sex and neutered into a combined field
 * @param {[sex:string, neutered:boolean]} val
 * @returns {string}
 */
export const transformSexNeutered = (val) => {
  const sexSign = {
    'Female': '♀',
    'Male': '♂'
  }[val[0]];
  return `${sexSign ? `${sexSign} ` : ''}${val[0]}${val[1] ? `\n${chalk.bgGreen.black(' Neutered ')}` : ''}`;
};

/**
 * Transforms a date of birth date into a string with short format and age
 * @param {Date} val
 * @returns {string}
 */
export const transformDobAndAge = (val) => {
  const dob = DateTime.fromJSDate(val);

  const diff = DateTime.now().diff(dob, ['years', 'months']);
  const age = Math.trunc(diff.years) ? `${Math.trunc(diff.years)} year(s)` : `${Math.trunc(diff.months)} month(s)`;

  return `${dob.toFormat('MMM d, yyyy')}\n${age}`;
};

/**
 * Transforms a set of location latitude and longitude into a google maps link
 * @param {[latitude:number, longitude:number]} val
 * @returns {string}
 */
export const transformLocation = (val) => (val.filter(v => v).length === 2) ?
  chalk.blueBright.underline(`http://map.google.com/?q=${val[0].toFixed(6)},${val[1].toFixed(6)}`) :
  undefined;

/**
 * Transforms species, breed, and color into a unified field
 * @param {[species:string, breed:string, color:string]} val
 * @returns {string}
 */
export const transformTypeBreedColor = (val) => `${val[0]}: ${val[1]}${val[2] ? `\n${val[2]}` : ''}`;

export const transformOutcomes = (val) => `${val[0]}${val[1] ? `\n${val[1]}` : ''}`;
