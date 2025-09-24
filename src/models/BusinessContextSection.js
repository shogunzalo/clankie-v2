const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class BusinessContextSection extends Model {
        static associate(models) {
            BusinessContextSection.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });
        }
    }

    BusinessContextSection.init(
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
            section_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 50],
                },
            },
            section_key: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 100],
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
            section_name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
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
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            display_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
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
            modelName: "BusinessContextSection",
            tableName: "business_context_sections",
            timestamps: true,
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["business_id", "section_key", "language_code"],
                    name: "unique_business_context_section",
                },
                {
                    fields: ["is_active"],
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

    return BusinessContextSection;
};
