"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Artists", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      slug: {
        type: Sequelize.STRING,
      },
      hight: {
        type: Sequelize.INTEGER,
      },
      bust: {
        type: Sequelize.INTEGER,
      },
      waist: {
        type: Sequelize.INTEGER,
      },
      hips: {
        type: Sequelize.INTEGER,
      },
      shoe_size: {
        type: Sequelize.INTEGER,
      },
      hair: {
        type: Sequelize.STRING,
      },
      eyes: {
        type: Sequelize.STRING,
      },
      user_id: {
        type: Sequelize.UUID,
      },
      cover_img: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Artists");
  },
};
