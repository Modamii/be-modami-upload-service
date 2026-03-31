'use strict';

const schema = process.env.POSTGRES_IMAGE_SCHEMA;
const tableName = 'image';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: tableName,
        schema: schema,
      },
      'error_code',
      {
        type: Sequelize.STRING,
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: tableName,
        schema: schema,
      },
      'error_code',
    );
  },
};
