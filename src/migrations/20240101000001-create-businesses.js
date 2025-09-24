"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("businesses", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            company_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            business_type: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            owner_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            owner_email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            website: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            primary_language: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "en",
            },
            auto_detect_language: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            timezone: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "UTC",
            },
            subscription_plan: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "free",
            },
            subscription_status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "active",
            },
            onboarding_completed: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            setup_step: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("businesses");
    },
};
