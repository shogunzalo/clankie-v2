"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "conversations",
            [
                {
                    business_id: 13,
                    client_id: 1,
                    source_id: 4,
                    detected_language: "en",
                    conversation_language: "en",
                    conversation_summary:
                        "Customer interested in AI features, scheduling demo",
                    customer_intent: "interested",
                    lead_score: 85,
                    sentiment_score: 0.7,
                    requires_human: false,
                    is_bot_active: true,
                    current_state: "active",
                    message_count: 8,
                    last_activity: new Date(Date.now() - 1000 * 60 * 30),
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    updated_at: new Date(Date.now() - 1000 * 60 * 30),
                },
                {
                    business_id: 13,
                    client_id: 2,
                    source_id: 4,
                    detected_language: "en",
                    conversation_language: "en",
                    conversation_summary:
                        "Enterprise customer with urgent timeline, discussing pricing",
                    customer_intent: "qualified",
                    lead_score: 95,
                    sentiment_score: 0.8,
                    requires_human: false,
                    is_bot_active: true,
                    current_state: "active",
                    message_count: 15,
                    last_activity: new Date(Date.now() - 1000 * 60 * 10),
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4),
                    updated_at: new Date(Date.now() - 1000 * 60 * 10),
                },
                {
                    business_id: 14,
                    client_id: 3,
                    source_id: 5,
                    detected_language: "en",
                    conversation_language: "en",
                    conversation_summary:
                        "Startup founder exploring business solutions",
                    customer_intent: "initial_contact",
                    lead_score: 60,
                    sentiment_score: 0.5,
                    requires_human: false,
                    is_bot_active: true,
                    current_state: "active",
                    message_count: 3,
                    last_activity: new Date(Date.now() - 1000 * 60 * 60),
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6),
                    updated_at: new Date(Date.now() - 1000 * 60 * 60),
                },
                {
                    business_id: 15,
                    client_id: 4,
                    source_id: 6,
                    detected_language: "en",
                    conversation_language: "en",
                    conversation_summary:
                        "Ready to sign contract, all requirements met",
                    customer_intent: "ready_to_convert",
                    lead_score: 98,
                    sentiment_score: 0.9,
                    requires_human: false,
                    is_bot_active: true,
                    current_state: "active",
                    message_count: 12,
                    last_activity: new Date(Date.now() - 1000 * 60 * 5),
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8),
                    updated_at: new Date(Date.now() - 1000 * 60 * 5),
                },
                {
                    business_id: 13,
                    client_id: 5,
                    source_id: 4,
                    detected_language: "en",
                    conversation_language: "en",
                    conversation_summary: "Budget constraints, not a good fit",
                    customer_intent: "lost",
                    lead_score: 20,
                    sentiment_score: -0.3,
                    requires_human: false,
                    is_bot_active: false,
                    current_state: "closed",
                    message_count: 5,
                    last_activity: new Date(
                        Date.now() - 1000 * 60 * 60 * 24 * 7
                    ),
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
                    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("conversations", null, {});
    },
};
