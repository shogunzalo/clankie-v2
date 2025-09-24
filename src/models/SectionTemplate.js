const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class SectionTemplate extends Model {
        static associate(models) {
            SectionTemplate.hasMany(models.SectionTemplateTranslation, {
                foreignKey: "template_id",
                as: "translations",
            });

            SectionTemplate.hasMany(models.BusinessTemplateResponse, {
                foreignKey: "template_id",
                as: "businessResponses",
            });
        }
    }

    SectionTemplate.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            section_key: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true,
                    len: [1, 100],
                },
            },
            is_required: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            display_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            character_min: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: {
                    min: 0,
                },
            },
            character_max: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: {
                    min: 0,
                },
            },
        },
        {
            sequelize,
            modelName: "SectionTemplate",
            tableName: "section_templates",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: false,
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["section_key"],
                },
                {
                    fields: ["display_order"],
                },
            ],
        }
    );

    return SectionTemplate;
};
