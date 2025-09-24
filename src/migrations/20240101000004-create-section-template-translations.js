"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
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
        });

        await queryInterface.addIndex(
            "section_template_translations",
            ["template_id", "language_code"],
            {
                unique: true,
                name: "unique_template_language",
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("section_template_translations");
    },
};
