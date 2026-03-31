'use strict';

const fileSchema = process.env.POSTGRES_FILE_SCHEMA;

module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addIndex(
      { schema: fileSchema, tableName: 'file' },
      {
        fields: ['id'],
      },
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async down(queryInterface, Sequelize) {},
};
