import { Model, DataTypes } from 'sequelize';

export default class Species extends Model {

  static setup(sequelize) {
    if (!Species.sequelize) {
      Species.init({
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        }
      }, { sequelize });
    }
  }

}
