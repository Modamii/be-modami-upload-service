'use strict';

const fileSchema = process.env.POSTGRES_FILE_SCHEMA;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: 'file',
        schema: fileSchema,
      },
      'is_use',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: 'file',
        schema: fileSchema,
      },
      'is_use',
    );
  },
};
