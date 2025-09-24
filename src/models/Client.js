const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Client extends Model {
        static associate(models) {
            Client.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });

            Client.hasMany(models.Conversation, {
                foreignKey: "client_id",
                as: "conversations",
            });

            Client.hasMany(models.Lead, {
                foreignKey: "client_id",
                as: "leads",
            });
        }
    }

    Client.init(
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
            platform_user_id: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
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
            display_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            full_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isEmail: true,
                },
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            company_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            preferred_language: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "en",
            },
            timezone: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "UTC",
            },
            first_contact: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            last_contact: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            total_conversations: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            total_leads: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            relationship_status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "new",
                validate: {
                    isIn: [
                        ["new", "prospect", "customer", "inactive", "blocked"],
                    ],
                },
            },
            engagement_score: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
            lifetime_value: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.0,
                validate: {
                    min: 0,
                },
            },
        },
        {
            sequelize,
            modelName: "Client",
            tableName: "clients",
            timestamps: true,
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: [
                        "business_id",
                        "platform_user_id",
                        "platform_type",
                    ],
                    name: "unique_platform_client",
                },
                {
                    fields: ["business_id", "relationship_status"],
                },
                {
                    fields: ["engagement_score"],
                },
                {
                    fields: ["last_contact"],
                },
            ],
        }
    );

    return Client;
};
