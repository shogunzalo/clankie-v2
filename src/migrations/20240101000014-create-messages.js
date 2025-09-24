"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("messages", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            conversation_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "conversations",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            sender_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            message_text: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            original_language: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            message_embedding: {
                type: Sequelize.ARRAY(Sequelize.FLOAT),
                allowNull: true,
            },
            platform_message_id: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            message_metadata: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            extracted_entities: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            detected_language: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            sentiment_score: {
                type: Sequelize.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            intent_classification: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            message_timestamp: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("messages");
    },
};
