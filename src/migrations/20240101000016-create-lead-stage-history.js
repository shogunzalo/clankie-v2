"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("lead_stage_history", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            lead_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "leads",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            from_stage: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            to_stage: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            progression_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            trigger_event: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            changed_by: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            confidence_score: {
                type: Sequelize.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            qualifying_factors: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            disqualifying_factors: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            time_in_previous_stage: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            conversation_context: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            changed_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("lead_stage_history");
    },
};
