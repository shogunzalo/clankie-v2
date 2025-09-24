"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("section_templates", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            section_key: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            is_required: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            display_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            character_min: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            character_max: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("section_templates");
    },
};
