"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("business_context_sections", {
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
            section_type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            section_key: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            language_code: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            section_name: {
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
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            display_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
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
            "business_context_sections",
            ["business_id", "section_key", "language_code"],
            {
                unique: true,
                name: "unique_business_context_section",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("business_context_sections");
    },
};
