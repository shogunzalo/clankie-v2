"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "platform_sources",
            [
                {
                    business_id: 13,
                    platform_type: "instagram",
                    platform_name: "Acme Corp Instagram",
                    is_connected: true,
                    connection_status: "connected",
                    credentials: JSON.stringify({
                        access_token: "demo_access_token_123",
                        page_id: "page_123456",
                        app_secret: "demo_app_secret_123",
                    }),
                    webhook_url:
                        "https://api.clankie.com/webhooks/instagram/webhook",
                    configuration: JSON.stringify({
                        auto_reply: true,
                        business_hours: "09:00-17:00",
                        timezone: "UTC",
                    }),
                    total_messages: 25,
                    active_conversations: 3,
                    last_sync: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    business_id: 14,
                    platform_type: "instagram",
                    platform_name: "TechStart Instagram",
                    is_connected: true,
                    connection_status: "connected",
                    credentials: JSON.stringify({
                        access_token: "demo_access_token_456",
                        page_id: "page_789012",
                        app_secret: "demo_app_secret_456",
                    }),
                    webhook_url:
                        "https://api.clankie.com/webhooks/instagram/webhook",
                    configuration: JSON.stringify({
                        auto_reply: true,
                        business_hours: "08:00-18:00",
                        timezone: "PST",
                    }),
                    total_messages: 45,
                    active_conversations: 2,
                    last_sync: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    business_id: 15,
                    platform_type: "whatsapp",
                    platform_name: "Local Services WhatsApp",
                    is_connected: true,
                    connection_status: "connected",
                    credentials: JSON.stringify({
                        access_token: "demo_whatsapp_token_789",
                        phone_number: "+1234567890",
                        app_secret: "demo_whatsapp_secret_789",
                    }),
                    webhook_url:
                        "https://api.clankie.com/webhooks/whatsapp/webhook",
                    configuration: JSON.stringify({
                        auto_reply: true,
                        business_hours: "09:00-17:00",
                        timezone: "EST",
                    }),
                    total_messages: 15,
                    active_conversations: 1,
                    last_sync: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("platform_sources", null, {});
    },
};
