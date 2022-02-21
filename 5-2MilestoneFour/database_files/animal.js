import { DateTime } from 'luxon';
import { Model, DataTypes } from 'sequelize';

export const AnimalSex = {
  MALE: 'Male',
  FEMALE: 'Female',
  UNKNOWN: 'Unknown'
};

export default class Animal extends Model {

  static setup(sequelize) {
    if (!Animal.sequelize) {
      Animal.init({
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        legacyId: {
          type: DataTypes.STRING,
          get() {
            const rawValue = this.getDataValue('legacyId');
            return rawValue ? rawValue : undefined;
          }
        },
        color: DataTypes.STRING,
        dateOfBirth: {
          type: DataTypes.DATEONLY,
          get() {
            const rawValue = this.getDataValue('dateOfBirth');
            return rawValue ? DateTime.fromSQL(rawValue).toJSDate() : undefined;
          }
        },
        name: DataTypes.STRING,
        locationLat: {
          type: DataTypes.DECIMAL(8, 6),
          get() {
            const rawValue = this.getDataValue('locationLat');
            return rawValue ? rawValue : undefined;
          }
        },
        locationLong: {
          type: DataTypes.DECIMAL(9, 6),
          get() {
            const rawValue = this.getDataValue('locationLong');
            return rawValue ? rawValue : undefined;
          }
        },
        sex: DataTypes.STRING,
        neutered: DataTypes.BOOLEAN,
        outcomeTypeId: {
          type: DataTypes.NUMBER,
          get() {
            const rawValue = this.getDataValue('outcomeTypeId');
            return rawValue ? rawValue : undefined;
          }
        },
        outcomeSubtypeId: {
          type: DataTypes.NUMBER,
          get() {
            const rawValue = this.getDataValue('outcomeSubtypeId');
            return rawValue ? rawValue : undefined;
          }
        }
      }, { sequelize });
    }
  }

}
