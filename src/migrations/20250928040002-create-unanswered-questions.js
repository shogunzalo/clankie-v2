"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("unanswered_questions", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
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
            question_text: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            normalized_question: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: "Normalized version for deduplication",
            },
            question_hash: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
                comment: "Hash for exact duplicate detection",
            },
            frequency: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            first_asked_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            last_asked_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            status: {
                type: Sequelize.ENUM(
                    "unanswered",
                    "resolved",
                    "ignored",
                    "duplicate"
                ),
                allowNull: false,
                defaultValue: "unanswered",
            },
            resolution_notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            resolved_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            resolved_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: "User ID who resolved the question",
            },
            context_sources_searched: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
                comment:
                    "Context sources that were searched but didn't provide answers",
            },
            template_sources_searched: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
                comment:
                    "Template sources that were searched but didn't provide answers",
            },
            conversation_context: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {},
                comment:
                    "Surrounding conversation context when question was asked",
            },
            confidence_scores: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Array of confidence scores from different attempts",
            },
            average_confidence: {
                type: Sequelize.DECIMAL(3, 2),
                allowNull: true,
                comment: "Average confidence score across all attempts",
            },
            language_code: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "en",
            },
            source_sessions: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Array of session IDs where this question was asked",
            },
            priority: {
                type: Sequelize.ENUM("low", "medium", "high", "critical"),
                allowNull: false,
                defaultValue: "medium",
            },
            tags: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Tags for categorization and filtering",
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {},
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

        await queryInterface.addIndex("unanswered_questions", ["business_id"]);
        await queryInterface.addIndex("unanswered_questions", ["status"]);
        await queryInterface.addIndex("unanswered_questions", ["frequency"]);
        await queryInterface.addIndex("unanswered_questions", [
            "last_asked_at",
        ]);
        await queryInterface.addIndex("unanswered_questions", ["priority"]);
        await queryInterface.addIndex(
            "unanswered_questions",
            ["question_hash"],
            {
                unique: true,
            }
        );
        await queryInterface.addIndex("unanswered_questions", [
            "business_id",
            "status",
        ]);
        await queryInterface.addIndex("unanswered_questions", [
            "business_id",
            "frequency",
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("unanswered_questions");
    },
};
