const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Service extends Model {
        static associate(models) {
            Service.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });
        }
    }

    Service.init(
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
            service_name: {
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
            price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
                validate: {
                    min: 0,
                },
            },
            currency: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "USD",
                validate: {
                    len: [3, 3],
                },
            },
            duration_minutes: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: {
                    min: 0,
                },
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
            display_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            sequelize,
            modelName: "Service",
            tableName: "services",
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
                    fields: ["display_order"],
                },
            ],
        }
    );

    return Service;
};
