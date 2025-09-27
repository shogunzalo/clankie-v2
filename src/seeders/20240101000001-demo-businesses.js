"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "businesses",
            [
                {
                    company_name: "Acme Corp",
                    owner_email: "owner@acme.com",
                    business_type: "SaaS",
                    owner_name: "John Acme",
                    phone: "+1-555-0101",
                    website: "https://acme.com",
                    primary_language: "en",
                    auto_detect_language: true,
                    timezone: "UTC",
                    subscription_plan: "premium",
                    subscription_status: "active",
                    onboarding_completed: true,
                    setup_step: "completed",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    company_name: "TechStart Inc",
                    owner_email: "founder@techstart.com",
                    business_type: "E-commerce",
                    owner_name: "Jane TechStart",
                    phone: "+1-555-0102",
                    website: "https://techstart.com",
                    primary_language: "en",
                    auto_detect_language: true,
                    timezone: "PST",
                    subscription_plan: "enterprise",
                    subscription_status: "active",
                    onboarding_completed: true,
                    setup_step: "completed",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    company_name: "Local Services Co",
                    owner_email: "admin@localservices.com",
                    business_type: "Service",
                    owner_name: "Mike Local",
                    phone: "+1-555-0103",
                    website: "https://localservices.com",
                    primary_language: "en",
                    auto_detect_language: true,
                    timezone: "EST",
                    subscription_plan: "basic",
                    subscription_status: "active",
                    onboarding_completed: true,
                    setup_step: "completed",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("businesses", null, {});
    },
};
