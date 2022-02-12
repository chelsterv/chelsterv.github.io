import { Model, DataTypes } from 'sequelize';

export default class Outcome extends Model {

  static setup(sequelize) {
    if (!Outcome.sequelize) {
      Outcome.init({
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        isSubtype: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          get() {
            const rawValue = this.getDataValue('isSubtype');
            return (rawValue === null) ? false : rawValue;
          }
        }
      }, { sequelize });
    }
  }

}
