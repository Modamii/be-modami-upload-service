'use strict';

const schemaName = process.env.POSTGRES_SCHEMA || 'public';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { tableName: 'file', schema: schemaName },
      {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.STRING,
        },
        userId: {
          field: 'user_id',
          allowNull: false,
          type: Sequelize.STRING,
        },
        originUrl: {
          field: 'origin_url',
          allowNull: true,
          type: Sequelize.STRING,
        },
        properties: {
          field: 'properties',
          allowNull: true,
          type: Sequelize.JSONB,
        },
        props: {
          field: 'props',
          allowNull: true,
          type: Sequelize.JSONB,
        },
        version: {
          field: 'version',
          allowNull: false,
          type: Sequelize.STRING,
        },
        createdAt: {
          field: 'created_at',
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          field: 'updated_at',
          allowNull: false,
          type: Sequelize.DATE,
        },
        deleteAt: {
          field: 'deleted_at',
          allowNull: true,
          type: Sequelize.DATE,
        },
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable({
      tableName: 'upload',
      schema: schemaName,
    });
  },
};
