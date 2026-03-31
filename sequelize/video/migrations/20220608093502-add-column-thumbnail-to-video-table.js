'use strict';

const schemaName = process.env.POSTGRES_VIDEO_SCHEMA;
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        tableName: 'video',
        schema: schemaName,
      },
      'thumbnails',
      {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      {
        tableName: 'video',
        schema: schemaName,
      },
      'thumbnails',
    );
  },
};
