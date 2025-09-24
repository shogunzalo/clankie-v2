const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class ContactInfo extends Model {
        static associate(models) {
            ContactInfo.belongsTo(models.Business, {
                foreignKey: "business_id",
                as: "business",
            });
        }
    }

    ContactInfo.init(
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
            info_type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    isIn: [
                        [
                            "phone",
                            "email",
                            "address",
                            "website",
                            "social_media",
                            "other",
                        ],
                    ],
                },
            },
            label: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 100],
                },
            },
            value: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true,
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
            priority: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            is_primary: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            sequelize,
            modelName: "ContactInfo",
            tableName: "contact_info",
            timestamps: true,
            paranoid: false,
            indexes: [
                {
                    fields: ["business_id", "info_type"],
                },
                {
                    fields: ["is_active"],
                },
                {
                    fields: ["is_primary"],
                },
            ],
        }
    );

    return ContactInfo;
};
