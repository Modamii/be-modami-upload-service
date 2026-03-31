'use strict';

const videoSchema = process.env.POSTGRES_VIDEO_SCHEMA;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: 'video',
        schema: videoSchema,
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
        tableName: 'video',
        schema: videoSchema,
      },
      'is_use',
    );
  },
};
