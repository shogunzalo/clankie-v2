"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("faq_keywords", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            faq_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "faq_items",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            keyword: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            weight: {
                type: Sequelize.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 1.0,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        await queryInterface.addIndex("faq_keywords", ["faq_id", "keyword"], {
            unique: true,
            name: "unique_faq_keyword",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("faq_keywords");
    },
};
