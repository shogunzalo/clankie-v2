const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Business extends Model {
        static associate(models) {
            // Business belongs to a User (owner)
            Business.belongsTo(models.User, {
                foreignKey: "owner_id",
                as: "owner",
            });

            // Core business relationships
            Business.hasMany(models.BusinessLanguage, {
                foreignKey: "business_id",
                as: "languages",
            });

            Business.hasMany(models.BusinessTemplateResponse, {
                foreignKey: "business_id",
                as: "templateResponses",
            });

            Business.hasMany(models.BusinessContextSection, {
                foreignKey: "business_id",
                as: "contextSections",
            });

            Business.hasMany(models.FaqItem, {
                foreignKey: "business_id",
                as: "faqItems",
            });

            Business.hasMany(models.ContactInfo, {
                foreignKey: "business_id",
                as: "contactInfo",
            });

            Business.hasMany(models.Service, {
                foreignKey: "business_id",
                as: "services",
            });

            Business.hasMany(models.PlatformSource, {
                foreignKey: "business_id",
                as: "platformSources",
            });

            Business.hasMany(models.Client, {
                foreignKey: "business_id",
                as: "clients",
            });

            Business.hasMany(models.Conversation, {
                foreignKey: "business_id",
                as: "conversations",
            });

            Business.hasMany(models.Lead, {
                foreignKey: "business_id",
                as: "leads",
            });

            Business.hasMany(models.UnansweredQuestion, {
                foreignKey: "business_id",
                as: "unansweredQuestions",
            });
        }
    }

    Business.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            company_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
            },
            business_type: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            owner_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            owner_email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            owner_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "id",
                },
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            website: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isUrl: true,
                },
            },
            primary_language: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "en",
            },
            auto_detect_language: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            timezone: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "UTC",
            },
            subscription_plan: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "free",
                validate: {
                    isIn: [["free", "basic", "premium", "enterprise"]],
                },
            },
            subscription_status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "active",
                validate: {
                    isIn: [["active", "inactive", "suspended", "cancelled"]],
                },
            },
            onboarding_completed: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            setup_step: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "Business",
            tableName: "businesses",
            timestamps: true,
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["owner_email"],
                },
                {
                    fields: ["subscription_status"],
                },
                {
                    fields: ["onboarding_completed"],
                },
            ],
        }
    );

    return Business;
};
