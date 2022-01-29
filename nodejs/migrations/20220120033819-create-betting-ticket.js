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
      date: {
        type: Sequelize.DATE
      },
      place: {
        type: Sequelize.STRING
      },
      num: {
        type: Sequelize.INTEGER
      },
      kind: {
        type: Sequelize.STRING
      },
      comb: {
        type: Sequelize.STRING
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
      bet: {
        type: Sequelize.INTEGER
      },
      refund: {
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