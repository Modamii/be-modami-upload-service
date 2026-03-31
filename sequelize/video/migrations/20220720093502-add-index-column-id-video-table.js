'use strict';

const videoSchema = process.env.POSTGRES_VIDEO_SCHEMA;

module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addIndex(
      { schema: videoSchema, tableName: 'video' },
      {
        fields: ['id'],
      },
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async down(queryInterface, Sequelize) {},
};
