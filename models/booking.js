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
      brand_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      contact_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 50],
        },
      },
      shoot_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: {
            msg: "check the date format please",
          },
          isAfter: {
            args: new Date().toISOString(),
            msg: "can not select past date",
          },
        },
      },
      booking_hour: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      wa_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          is: {
            args: /^[0-9]{10,15}$/,
            msg: "Check your phone number format",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          isEmail: true,
        },
      },
      desired_model: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      usages: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "incoming",
        validate: {
          isIn: [["incoming", "process", "reject", "done"]],
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Booking",
    }
  );

  return Booking;
};
