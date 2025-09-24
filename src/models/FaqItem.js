const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class FaqItem extends Model {
        static associate(models) {
            FaqItem.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });

            FaqItem.hasMany(models.FaqKeyword, {
                foreignKey: "faq_id",
                as: "keywords",
            });
        }
    }

    FaqItem.init(
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
            language_code: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [2, 10],
                },
            },
            question: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            answer: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            question_embedding: {
                type: DataTypes.ARRAY(DataTypes.FLOAT),
                allowNull: true,
            },
            answer_embedding: {
                type: DataTypes.ARRAY(DataTypes.FLOAT),
                allowNull: true,
            },
            combined_embedding: {
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
            category: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            usage_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                validate: {
                    min: 0,
                },
            },
            success_rate: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0.0,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
            last_used: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "FaqItem",
            tableName: "faq_items",
            timestamps: true,
            paranoid: false,
            indexes: [
                {
                    fields: ["business_id", "language_code"],
                },
                {
                    fields: ["is_active"],
                },
                {
                    fields: ["category"],
                },
                {
                    fields: ["usage_count"],
                },
                {
                    fields: ["success_rate"],
                },
            ],
        }
    );

    return FaqItem;
};
