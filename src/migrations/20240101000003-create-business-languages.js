"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("business_languages", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            business_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "businesses",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            language_code: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            is_primary: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        await queryInterface.addIndex(
            "business_languages",
            ["business_id", "language_code"],
            {
                unique: true,
                name: "unique_business_language",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("business_languages");
    },
};
