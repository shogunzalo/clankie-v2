const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class BusinessTemplateResponse extends Model {
        static associate(models) {
            BusinessTemplateResponse.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });

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
                validate: {
                    notEmpty: true,
                    len: [2, 10],
                },
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            content_embedding: {
                type: DataTypes.ARRAY(DataTypes.FLOAT),
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
                defaultValue: "incomplete",
                validate: {
                    isIn: [["incomplete", "complete", "needs_review"]],
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
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["business_id", "template_id", "language_code"],
                    name: "unique_business_template_response",
                },
                {
                    fields: ["completion_status"],
                },
                {
                    fields: ["search_hits"],
                },
            ],
        }
    );

    return BusinessTemplateResponse;
};
