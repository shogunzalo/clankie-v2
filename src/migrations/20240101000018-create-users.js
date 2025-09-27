"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("users", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            firebase_uid: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            display_name: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            photo_url: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            roles: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: ["user"],
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: {},
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            last_login: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
        });

        // Add indexes
        await queryInterface.addIndex("users", ["firebase_uid"], {
            unique: true,
            name: "users_firebase_uid_unique",
        });

        await queryInterface.addIndex("users", ["email"], {
            unique: true,
            name: "users_email_unique",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("users");
    },
};
