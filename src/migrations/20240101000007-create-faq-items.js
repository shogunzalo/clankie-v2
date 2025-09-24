"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("faq_items", {
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
            question: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            answer: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            question_embedding: {
                type: Sequelize.ARRAY(Sequelize.FLOAT),
                allowNull: true,
            },
            answer_embedding: {
                type: Sequelize.ARRAY(Sequelize.FLOAT),
                allowNull: true,
            },
            combined_embedding: {
                type: Sequelize.ARRAY(Sequelize.FLOAT),
                allowNull: true,
            },
            embedding_model: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            embedding_updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            category: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            usage_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            success_rate: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            last_used: {
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
        await queryInterface.dropTable("faq_items");
    },
};
