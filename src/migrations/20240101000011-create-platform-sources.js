"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("platform_sources", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            business_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "businesses",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            platform_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            platform_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            is_connected: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            connection_status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "disconnected",
            },
            credentials: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            webhook_url: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            configuration: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            total_messages: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            active_conversations: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            last_sync: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("platform_sources");
    },
};
