"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("unanswered_questions", {
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
            question: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            question_language: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            context: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            frequency: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            first_asked: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            last_asked: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "pending",
            },
            resolution_type: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            admin_response: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            admin_response_language: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            resolved_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("unanswered_questions");
    },
};
