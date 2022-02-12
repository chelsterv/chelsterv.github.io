import { Model, DataTypes } from 'sequelize';

export default class Breed extends Model {

  static setup(sequelize) {
    if (!Breed.sequelize) {
      Breed.init({
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
