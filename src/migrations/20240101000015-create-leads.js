"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("leads", {
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
            client_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "clients",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            conversation_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "conversations",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            lead_source: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            lead_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            current_stage: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "new",
            },
            previous_stage: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            stage_progression_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            qualification_score: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            interest_level: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            engagement_level: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            service_interest: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            budget_indication: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            timeline_indication: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            decision_maker_status: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            converted_to: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            conversion_value: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            lost_reason: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            stage_entered_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            time_in_current_stage: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            total_funnel_time: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            final_outcome: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            outcome_date: {
                type: Sequelize.DATE,
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
        await queryInterface.dropTable("leads");
    },
};
