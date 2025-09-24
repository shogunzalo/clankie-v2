const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class BusinessLanguage extends Model {
        static associate(models) {
            BusinessLanguage.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });
        }
    }

    BusinessLanguage.init(
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
            is_primary: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            sequelize,
            modelName: "BusinessLanguage",
            tableName: "business_languages",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: false,
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["business_id", "language_code"],
                    name: "unique_business_language",
                },
            ],
        }
    );

    return BusinessLanguage;
};
