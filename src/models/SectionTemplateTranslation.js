const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class SectionTemplateTranslation extends Model {
        static associate(models) {
            // SectionTemplateTranslation belongs to SectionTemplate
            SectionTemplateTranslation.belongsTo(models.SectionTemplate, {
                foreignKey: "template_id",
                as: "template",
            });
        }
    }

    SectionTemplateTranslation.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
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
                    len: [2, 5],
                },
            },
            section_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            placeholder_text: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            example_content: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "SectionTemplateTranslation",
            tableName: "section_template_translations",
            timestamps: false,
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["template_id", "language_code"],
                    name: "unique_template_language",
                },
                {
                    fields: ["language_code"],
                },
            ],
        }
    );

    return SectionTemplateTranslation;
};