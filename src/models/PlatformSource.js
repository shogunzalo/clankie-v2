const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class PlatformSource extends Model {
        static associate(models) {
            PlatformSource.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });

            PlatformSource.hasMany(models.Conversation, {
                foreignKey: "source_id",
                as: "conversations",
            });
        }
    }

    PlatformSource.init(
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
            platform_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isIn: [
                        [
                            "whatsapp",
                            "telegram",
                            "facebook",
                            "instagram",
                            "website",
                            "email",
                            "other",
                        ],
                    ],
                },
            },
            platform_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 100],
                },
            },
            is_connected: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            connection_status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "disconnected",
                validate: {
                    isIn: [["connected", "disconnected", "error", "pending"]],
                },
            },
            credentials: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            webhook_url: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isUrl: true,
                },
            },
            configuration: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            total_messages: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            active_conversations: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            last_sync: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "PlatformSource",
            tableName: "platform_sources",
            timestamps: true,
            paranoid: false,
            indexes: [
                {
                    fields: ["business_id", "platform_type"],
                },
                {
                    fields: ["is_connected"],
                },
                {
                    fields: ["connection_status"],
                },
            ],
        }
    );

    return PlatformSource;
};
