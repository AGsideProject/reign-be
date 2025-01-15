"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Asset extends Model {
    static associate(models) {
      Asset.belongsTo(models.Artist, {
        foreignKey: "model_id",
      });
    }
  }
  Asset.init(
    {
      img_url: DataTypes.STRING,
      type: DataTypes.STRING,
      order: DataTypes.INTEGER,
      model_id: DataTypes.INTEGER,
      orientation: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Asset",
    }
  );
  return Asset;
};
