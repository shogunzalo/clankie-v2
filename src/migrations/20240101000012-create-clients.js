"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("clients", {
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
            platform_user_id: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            platform_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            display_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            full_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            phone: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            company_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            preferred_language: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "en",
            },
            timezone: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "UTC",
            },
            first_contact: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            last_contact: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            total_conversations: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            total_leads: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            relationship_status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "new",
            },
            engagement_score: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            lifetime_value: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.0,
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

        await queryInterface.addIndex(
            "clients",
            ["business_id", "platform_user_id", "platform_type"],
            {
                unique: true,
                name: "unique_platform_client",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("clients");
    },
};
