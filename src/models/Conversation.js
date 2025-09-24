const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Conversation extends Model {
        static associate(models) {
            Conversation.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });

            Conversation.belongsTo(models.Client, {
                foreignKey: "client_id",
                as: "client",
            });

            Conversation.belongsTo(models.PlatformSource, {
                foreignKey: "source_id",
                as: "platformSource",
            });

            Conversation.hasMany(models.Message, {
                foreignKey: "conversation_id",
                as: "messages",
            });

            Conversation.hasMany(models.Lead, {
                foreignKey: "conversation_id",
                as: "leads",
            });

            Conversation.hasMany(models.UnansweredQuestion, {
                foreignKey: "conversation_id",
                as: "unansweredQuestions",
            });
        }
    }

    Conversation.init(
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
            },
            client_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "clients",
                    key: "id",
                },
            },
            source_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "platform_sources",
                    key: "id",
                },
            },
            detected_language: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            conversation_language: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "en",
            },
            conversation_summary: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            customer_intent: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            lead_score: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
            sentiment_score: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 0.0,
                validate: {
                    min: -1,
                    max: 1,
                },
            },
            requires_human: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            human_takeover_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            assigned_agent_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            is_bot_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            current_state: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "active",
                validate: {
                    isIn: [["active", "paused", "closed", "escalated"]],
                },
            },
            message_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            last_activity: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "Conversation",
            tableName: "conversations",
            timestamps: true,
            paranoid: false,
            indexes: [
                {
                    fields: ["business_id", "client_id"],
                },
                {
                    fields: ["current_state"],
                },
                {
                    fields: ["lead_score"],
                },
                {
                    fields: ["last_activity"],
                },
                {
                    fields: ["requires_human"],
                },
            ],
        }
    );

    return Conversation;
};
