"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add owner_id column to businesses table
        await queryInterface.addColumn("businesses", "owner_id", {
            type: Sequelize.INTEGER,
            allowNull: true, // Allow null for existing records
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        });

        // Add index for owner_id
        await queryInterface.addIndex("businesses", ["owner_id"], {
            name: "businesses_owner_id_idx",
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove index
        await queryInterface.removeIndex(
            "businesses",
            "businesses_owner_id_idx"
        );

        // Remove owner_id column
        await queryInterface.removeColumn("businesses", "owner_id");
    },
};
