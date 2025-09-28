const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class BusinessTemplateResponse extends Model {
        static associate(models) {
            // BusinessTemplateResponse belongs to Business
            BusinessTemplateResponse.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });

            // BusinessTemplateResponse belongs to SectionTemplate
            BusinessTemplateResponse.belongsTo(models.SectionTemplate, {
                foreignKey: "template_id",
                as: "template",
            });
        }
    }

    BusinessTemplateResponse.init(
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
            template_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "section_templates",
                    key: "id",
                },
            },
            language_code: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "en",
                validate: {
                    notEmpty: true,
                    len: [2, 5],
                },
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            content_embedding: {
                type: DataTypes.JSONB,
                allowNull: true,
            },
            embedding_model: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            embedding_updated_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            character_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            word_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            completion_status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "not_started",
                validate: {
                    isIn: [["not_started", "in_progress", "completed"]],
                },
            },
            search_hits: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            last_accessed: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "BusinessTemplateResponse",
            tableName: "business_template_responses",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["business_id", "template_id", "language_code"],
                    name: "unique_business_template_language",
                },
                {
                    fields: ["completion_status"],
                },
                {
                    fields: ["search_hits"],
                },
                {
                    fields: ["last_accessed"],
                },
            ],
        }
    );

    return BusinessTemplateResponse;
};