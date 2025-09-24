const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class UnansweredQuestion extends Model {
        static associate(models) {
            UnansweredQuestion.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });

            UnansweredQuestion.belongsTo(models.Conversation, {
                foreignKey: "conversation_id",
                as: "conversation",
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
            },
            conversation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "conversations",
                    key: "id",
                },
            },
            question: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            question_language: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [2, 10],
                },
            },
            context: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            frequency: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
                validate: {
                    min: 1,
                },
            },
            first_asked: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            last_asked: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "pending",
                validate: {
                    isIn: [["pending", "resolved", "ignored", "escalated"]],
                },
            },
            resolution_type: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isIn: [
                        [
                            "faq_added",
                            "context_updated",
                            "manual_response",
                            "escalated",
                        ],
                    ],
                },
            },
            admin_response: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            admin_response_language: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            resolved_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "UnansweredQuestion",
            tableName: "unanswered_questions",
            timestamps: false,
            paranoid: false,
            indexes: [
                {
                    fields: ["business_id", "status"],
                },
                {
                    fields: ["frequency"],
                },
                {
                    fields: ["first_asked"],
                },
                {
                    fields: ["last_asked"],
                },
            ],
        }
    );

    return UnansweredQuestion;
};
