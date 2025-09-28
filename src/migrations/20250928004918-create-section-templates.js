"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create section_templates table
        await queryInterface.createTable("section_templates", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            section_key: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            is_required: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            display_order: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            character_min: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            character_max: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 5000,
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

        // Create section_template_translations table
        await queryInterface.createTable("section_template_translations", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
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
            section_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            placeholder_text: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            example_content: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        // Create business_template_responses table
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
                defaultValue: "en",
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            content_embedding: {
                type: Sequelize.JSONB,
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
                defaultValue: "not_started",
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

        // Add indexes
        // Index already created by UNIQUE constraint
        await queryInterface.addIndex("section_templates", ["display_order"]);
        await queryInterface.addIndex("section_templates", ["is_required"]);

        await queryInterface.addIndex(
            "section_template_translations",
            ["template_id", "language_code"],
            { unique: true }
        );
        await queryInterface.addIndex("section_template_translations", [
            "language_code",
        ]);

        // Unique index already created by UNIQUE constraint
        await queryInterface.addIndex("business_template_responses", [
            "completion_status",
        ]);
        await queryInterface.addIndex("business_template_responses", [
            "search_hits",
        ]);
        await queryInterface.addIndex("business_template_responses", [
            "last_accessed",
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("business_template_responses");
        await queryInterface.dropTable("section_template_translations");
        await queryInterface.dropTable("section_templates");
    },
};
