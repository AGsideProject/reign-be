'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      brand_name: {
        type: Sequelize.STRING
      },
      contact_name: {
        type: Sequelize.STRING
      },
      shoot_date: {
        type: Sequelize.DATE
      },
      booking_hour: {
        type: Sequelize.INTEGER
      },
      wa_number: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      desired_model: {
        type: Sequelize.STRING
      },
      usages: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      user_id: {
        type: Sequelize.UUID
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bookings');
  }
};