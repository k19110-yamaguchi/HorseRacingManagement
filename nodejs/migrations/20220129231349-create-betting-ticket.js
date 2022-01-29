'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BettingTickets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      raceId: {
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.INTEGER
      },
      place: {
        type: Sequelize.STRING
      },
      num: {
        type: Sequelize.INTEGER
      },
      racename: {
        type: Sequelize.STRING
      },
      money: {
        type: Sequelize.INTEGER
      },
      kind: {
        type: Sequelize.STRING
      },
      comb: {
        type: Sequelize.STRING
      },
      elm: {
        type: Sequelize.INTEGER
      },
      elmLen: {
        type: Sequelize.INTEGER
      },
      combNum: {
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
    await queryInterface.dropTable('BettingTickets');
  }
};