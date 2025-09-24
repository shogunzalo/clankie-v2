const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class FaqKeyword extends Model {
        static associate(models) {
            FaqKeyword.belongsTo(models.FaqItem, {
                foreignKey: "faq_id",
                as: "faqItem",
            });
        }
    }

    FaqKeyword.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            faq_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "faq_items",
                    key: "id",
                },
            },
            keyword: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 100],
                },
            },
            weight: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 1.0,
                validate: {
                    min: 0,
                    max: 10,
                },
            },
        },
        {
            sequelize,
            modelName: "FaqKeyword",
            tableName: "faq_keywords",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: false,
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["faq_id", "keyword"],
                    name: "unique_faq_keyword",
                },
            ],
        }
    );

    return FaqKeyword;
};
