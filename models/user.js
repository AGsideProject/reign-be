"use strict";
const { Model } = require("sequelize");
const { hashThePassword } = require("../helpers/encryption");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Session, {
        foreignKey: "user_id",
      });

      User.hasMany(models.Artist, {
        foreignKey: "user_id",
      });

      User.hasMany(models.Booking, {
        foreignKey: "user_id",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "email must be unique",
        },
        validate: {
          isEmail: {
            msg: "please check your format email",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: { args: [8, 100], msg: "Password min 8 char" },
          isStrongPassword(value) {
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(value)) {
              throw new Error(
                "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character."
              );
            }
          },
        },
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
    }
  );

  // Hash password before creating a new user
  User.beforeCreate((user) => {
    user.password = hashThePassword(user.password);
  });

  // Hash password before updating the user if password is changed
  User.beforeUpdate((user) => {
    if (user.changed("password")) {
      user.password = hashThePassword(user.password);
    }
  });

  return User;
};
