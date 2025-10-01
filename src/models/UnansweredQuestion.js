const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class UnansweredQuestion extends Model {
        static associate(models) {
            UnansweredQuestion.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });
        }
    }

    UnansweredQuestion.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            business_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "businesses",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            question_text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            normalized_question: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: "Normalized version for deduplication",
            },
            question_hash: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                comment: "Hash for exact duplicate detection",
            },
            frequency: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            first_asked_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            last_asked_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            status: {
                type: DataTypes.ENUM("unanswered", "resolved", "ignored", "duplicate"),
                allowNull: false,
                defaultValue: "unanswered",
            },
            resolution_notes: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            resolved_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            resolved_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "User ID who resolved the question",
            },
            context_sources_searched: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Context sources that were searched but didn't provide answers",
            },
            template_sources_searched: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Template sources that were searched but didn't provide answers",
            },
            conversation_context: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
                comment: "Surrounding conversation context when question was asked",
            },
            conversation_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: "ID of the conversation where the question was asked",
            },
            confidence_scores: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Array of confidence scores from different attempts",
            },
            average_confidence: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: true,
                comment: "Average confidence score across all attempts",
            },
            language_code: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "en",
            },
            source_sessions: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Array of session IDs where this question was asked",
            },
            priority: {
                type: DataTypes.ENUM("low", "medium", "high", "critical"),
                allowNull: false,
                defaultValue: "medium",
            },
            tags: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: [],
                comment: "Tags for categorization and filtering",
            },
            metadata: {
                type: DataTypes.JSONB,
                allowNull: true,
                defaultValue: {},
            },
        },
        {
            sequelize,
            modelName: "UnansweredQuestion",
            tableName: "unanswered_questions",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            paranoid: false,
            indexes: [
                {
                    fields: ["business_id"],
                },
                {
                    fields: ["status"],
                },
                {
                    fields: ["frequency"],
                },
                {
                    fields: ["last_asked_at"],
                },
                {
                    fields: ["priority"],
                },
                {
                    fields: ["question_hash"],
                    unique: true,
                },
                {
                    fields: ["business_id", "status"],
                },
                {
                    fields: ["business_id", "frequency"],
                },
            ],
        }
    );

    return UnansweredQuestion;
};