const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Message extends Model {
        static associate(models) {
            Message.belongsTo(models.Conversation, {
                foreignKey: "conversation_id",
                as: "conversation",
            });
        }
    }

    Message.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            conversation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "conversations",
                    key: "id",
                },
            },
            sender_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isIn: [["customer", "bot", "agent", "system"]],
                },
            },
            message_text: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            original_language: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            message_embedding: {
                type: DataTypes.ARRAY(DataTypes.FLOAT),
                allowNull: true,
            },
            platform_message_id: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            message_metadata: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            extracted_entities: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            detected_language: {
                type: DataTypes.STRING,
                allowNull: true,
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
            intent_classification: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            message_timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "Message",
            tableName: "messages",
            timestamps: false,
            paranoid: false,
            indexes: [
                {
                    fields: ["conversation_id"],
                },
                {
                    fields: ["sender_type"],
                },
                {
                    fields: ["message_timestamp"],
                },
                {
                    fields: ["sentiment_score"],
                },
            ],
        }
    );

    return Message;
};
