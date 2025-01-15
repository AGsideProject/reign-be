"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.User, {
        foreignKey: "user_id",
      });
    }
  }
  Booking.init(
    {
      brand_name: DataTypes.STRING,
      contact_name: DataTypes.STRING,
      shoot_date: DataTypes.DATE,
      booking_hour: DataTypes.STRING,
      wa_number: DataTypes.STRING,
      email: DataTypes.STRING,
      desired_model: DataTypes.STRING,
      usages: DataTypes.STRING,
      status: DataTypes.STRING,
      user_id: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: "Booking",
    }
  );

  Booking.beforeCreate((book) => {
    book.status = "ongoing";
  });

  return Booking;
};
