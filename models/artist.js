"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Artist extends Model {
    static associate(models) {
      Artist.hasMany(models.Asset, {
        foreignKey: "model_id",
      });

      Artist.belongsTo(models.User, {
        foreignKey: "user_id",
      });
    }
  }
  Artist.init(
    {
      name: DataTypes.STRING,
      slug: DataTypes.STRING,
      ig_username: DataTypes.STRING,
      gender: DataTypes.STRING,
      hight: DataTypes.INTEGER,
      bust: DataTypes.INTEGER,
      waist: DataTypes.INTEGER,
      hips: DataTypes.INTEGER,
      shoe_size: DataTypes.INTEGER,
      hair: DataTypes.STRING,
      eyes: DataTypes.STRING,
      user_id: DataTypes.UUID,
      cover_img: DataTypes.STRING,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Artist",
    }
  );
  return Artist;
};
