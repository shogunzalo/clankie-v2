"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("test_messages", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            session_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "test_sessions",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
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
            message_type: {
                type: Sequelize.ENUM("user", "assistant", "system"),
                allowNull: false,
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            confidence_score: {
                type: Sequelize.DECIMAL(3, 2),
                allowNull: true,
            },
            response_time: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: "Response time in milliseconds",
            },
            context_sources: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Array of context sources used in response",
            },
            template_sources: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Array of template sources used in response",
            },
            embedding_vector: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: "Embedding vector for semantic search",
            },
            is_answered: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            answer_quality: {
                type: Sequelize.ENUM(
                    "excellent",
                    "good",
                    "fair",
                    "poor",
                    "unanswered"
                ),
                allowNull: true,
            },
            user_feedback: {
                type: Sequelize.ENUM(
                    "helpful",
                    "not_helpful",
                    "partially_helpful"
                ),
                allowNull: true,
            },
            security_flags: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {},
                comment: "Security-related flags and warnings",
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            sequence_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: "Message sequence within the session",
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });

        await queryInterface.addIndex("test_messages", ["session_id"]);
        await queryInterface.addIndex("test_messages", ["business_id"]);
        await queryInterface.addIndex("test_messages", ["message_type"]);
        await queryInterface.addIndex("test_messages", ["is_answered"]);
        await queryInterface.addIndex("test_messages", ["confidence_score"]);
        await queryInterface.addIndex("test_messages", ["created_at"]);
        await queryInterface.addIndex("test_messages", [
            "session_id",
            "sequence_number",
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("test_messages");
    },
};
