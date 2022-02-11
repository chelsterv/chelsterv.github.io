import { Model, DataTypes } from 'sequelize';

export default class User extends Model {

  static setup(sequelize) {
    if (!User.sequelize) {
      User.init({
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false
        },
        isAdmin: DataTypes.BOOLEAN
      }, { sequelize });
    }
  }

}
