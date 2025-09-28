"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("test_sessions", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
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
            session_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            scenario_type: {
                type: Sequelize.ENUM("manual", "automated", "bulk"),
                allowNull: false,
                defaultValue: "manual",
            },
            status: {
                type: Sequelize.ENUM("active", "completed", "paused", "failed"),
                allowNull: false,
                defaultValue: "active",
            },
            message_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            answered_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            unanswered_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            average_confidence: {
                type: Sequelize.DECIMAL(3, 2),
                allowNull: true,
            },
            average_response_time: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: "Average response time in milliseconds",
            },
            total_response_time: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: "Total response time in milliseconds",
            },
            started_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            completed_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                defaultValue: {},
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });

        await queryInterface.addIndex("test_sessions", ["business_id"]);
        await queryInterface.addIndex("test_sessions", ["status"]);
        await queryInterface.addIndex("test_sessions", ["started_at"]);
        await queryInterface.addIndex("test_sessions", ["scenario_type"]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("test_sessions");
    },
};
