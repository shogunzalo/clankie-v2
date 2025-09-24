"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("business_template_responses", {
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
            template_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "section_templates",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            language_code: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            content_embedding: {
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
            character_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            word_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            completion_status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "incomplete",
            },
            search_hits: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            last_accessed: {
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

        await queryInterface.addIndex(
            "business_template_responses",
            ["business_id", "template_id", "language_code"],
            {
                unique: true,
                name: "unique_business_template_response",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("business_template_responses");
    },
};
