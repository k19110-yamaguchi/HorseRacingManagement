'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Refunds', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      raceId: {
        type: Sequelize.INTEGER
      },
      first: {
        type: Sequelize.INTEGER
      },
      second: {
        type: Sequelize.INTEGER
      },
      third: {
        type: Sequelize.INTEGER
      },
      win: {
        type: Sequelize.INTEGER
      },
      place: {
        type: Sequelize.INTEGER
      },
      bracket: {
        type: Sequelize.INTEGER
      },
      quinella: {
        type: Sequelize.INTEGER
      },
      wid: {
        type: Sequelize.INTEGER
      },
      exacta: {
        type: Sequelize.INTEGER
      },
      trio: {
        type: Sequelize.INTEGER
      },
      trifecta: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('Refunds');
  }
};