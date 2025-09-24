"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("conversations", {
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
            client_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "clients",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            source_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "platform_sources",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            detected_language: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            conversation_language: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "en",
            },
            conversation_summary: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            customer_intent: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            lead_score: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            sentiment_score: {
                type: Sequelize.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            requires_human: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            human_takeover_reason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            assigned_agent_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            is_bot_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            current_state: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "active",
            },
            message_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            last_activity: {
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
        await queryInterface.dropTable("conversations");
    },
};
