"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "clients",
            [
                {
                    business_id: 13,
                    platform_user_id: "user_123456",
                    platform_type: "instagram",
                    display_name: "John Doe",
                    full_name: "John Doe",
                    email: "john.doe@example.com",
                    company_name: "Doe Enterprises",
                    preferred_language: "en",
                    timezone: "UTC",
                    first_contact: new Date(
                        Date.now() - 1000 * 60 * 60 * 24 * 7
                    ),
                    last_contact: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    total_conversations: 1,
                    total_leads: 1,
                    relationship_status: "engaged",
                    engagement_score: 85,
                    lifetime_value: 2500.0,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    business_id: 13,
                    platform_user_id: "user_789012",
                    platform_type: "instagram",
                    display_name: "Jane Smith",
                    full_name: "Jane Smith",
                    email: "jane.smith@techcorp.com",
                    company_name: "TechCorp Solutions",
                    preferred_language: "en",
                    timezone: "PST",
                    first_contact: new Date(
                        Date.now() - 1000 * 60 * 60 * 24 * 5
                    ),
                    last_contact: new Date(Date.now() - 1000 * 60 * 10),
                    total_conversations: 1,
                    total_leads: 1,
                    relationship_status: "qualified",
                    engagement_score: 92,
                    lifetime_value: 5000.0,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    business_id: 14,
                    platform_user_id: "user_345678",
                    platform_type: "instagram",
                    display_name: "Mike Johnson",
                    full_name: "Mike Johnson",
                    email: "mike.johnson@startup.io",
                    company_name: "StartupIO",
                    preferred_language: "en",
                    timezone: "EST",
                    first_contact: new Date(
                        Date.now() - 1000 * 60 * 60 * 24 * 3
                    ),
                    last_contact: new Date(Date.now() - 1000 * 60 * 60),
                    total_conversations: 1,
                    total_leads: 1,
                    relationship_status: "new",
                    engagement_score: 78,
                    lifetime_value: 1500.0,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    business_id: 15,
                    platform_user_id: "user_901234",
                    platform_type: "whatsapp",
                    display_name: "Sarah Wilson",
                    full_name: "Sarah Wilson",
                    email: "sarah.wilson@localbusiness.com",
                    company_name: "Wilson & Associates",
                    preferred_language: "en",
                    timezone: "EST",
                    first_contact: new Date(
                        Date.now() - 1000 * 60 * 60 * 24 * 2
                    ),
                    last_contact: new Date(Date.now() - 1000 * 60 * 5),
                    total_conversations: 1,
                    total_leads: 1,
                    relationship_status: "ready_to_convert",
                    engagement_score: 95,
                    lifetime_value: 7500.0,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    business_id: 13,
                    platform_user_id: "user_567890",
                    platform_type: "instagram",
                    display_name: "David Brown",
                    full_name: "David Brown",
                    email: "david.brown@freelancer.com",
                    company_name: "Brown Freelance",
                    preferred_language: "en",
                    timezone: "UTC",
                    first_contact: new Date(
                        Date.now() - 1000 * 60 * 60 * 24 * 10
                    ),
                    last_contact: new Date(
                        Date.now() - 1000 * 60 * 60 * 24 * 7
                    ),
                    total_conversations: 1,
                    total_leads: 1,
                    relationship_status: "lost",
                    engagement_score: 45,
                    lifetime_value: 0.0,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("clients", null, {});
    },
};
