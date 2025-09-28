"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add calendar_settings column to businesses table
        await queryInterface.addColumn("businesses", "calendar_settings", {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: null,
        });

        // Add business_hours column to businesses table
        await queryInterface.addColumn("businesses", "business_hours", {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: null,
        });

        // Add business_context column to businesses table
        await queryInterface.addColumn("businesses", "business_context", {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: null,
        });

        // Add ai_tool_functions column to businesses table
        await queryInterface.addColumn("businesses", "ai_tool_functions", {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove the added columns
        await queryInterface.removeColumn("businesses", "calendar_settings");
        await queryInterface.removeColumn("businesses", "business_hours");
        await queryInterface.removeColumn("businesses", "business_context");
        await queryInterface.removeColumn("businesses", "ai_tool_functions");
    },
};
