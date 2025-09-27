"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "messages",
            [
                // Conversation 1 - John Doe (interested)
                {
                    id: 1,
                    conversation_id: 1,
                    sender_type: "customer",
                    message_text:
                        "Hi! I saw your ad and I'm interested in your SaaS platform. Can you tell me more about the features?",
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    platform_message_id: "msg_001",
                    attachments: null,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
                },
                {
                    id: 2,
                    conversation_id: 1,
                    sender_type: "bot",
                    message_text:
                        "Hello John! Thank you for your interest in our SaaS platform. Our platform offers comprehensive business automation, AI-powered analytics, and seamless integrations. Would you like to schedule a demo to see it in action?",
                    timestamp: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5
                    ),
                    platform_message_id: "msg_002",
                    attachments: null,
                    created_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5
                    ),
                    updated_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5
                    ),
                },
                {
                    id: 3,
                    conversation_id: 1,
                    sender_type: "customer",
                    message_text:
                        "That sounds great! I'm particularly interested in the AI analytics. What kind of insights can it provide?",
                    timestamp: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 10
                    ),
                    platform_message_id: "msg_003",
                    attachments: null,
                    created_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 10
                    ),
                    updated_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 10
                    ),
                },
                {
                    id: 4,
                    conversation_id: 1,
                    sender_type: "bot",
                    message_text:
                        "Our AI analytics provides real-time insights into customer behavior, sales trends, and operational efficiency. It can predict customer churn, optimize pricing strategies, and identify growth opportunities. Would you like to see a live demo of the analytics dashboard?",
                    timestamp: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 15
                    ),
                    platform_message_id: "msg_004",
                    attachments: null,
                    created_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 15
                    ),
                    updated_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 15
                    ),
                },
                {
                    id: 5,
                    conversation_id: 1,
                    sender_type: "customer",
                    message_text:
                        "Yes, that would be perfect! When can we schedule the demo? I'm available this week.",
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    platform_message_id: "msg_005",
                    attachments: null,
                    created_at: new Date(Date.now() - 1000 * 60 * 30),
                    updated_at: new Date(Date.now() - 1000 * 60 * 30),
                },

                // Conversation 2 - Jane Smith (qualified)
                {
                    id: 6,
                    conversation_id: 2,
                    sender_type: "customer",
                    message_text:
                        "Hi! We're looking for a comprehensive solution for our tech company. We have about 50 employees and need something scalable.",
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
                    platform_message_id: "msg_006",
                    attachments: null,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4),
                    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4),
                },
                {
                    id: 7,
                    conversation_id: 2,
                    sender_type: "bot",
                    message_text:
                        "Hello Jane! Our Enterprise plan would be perfect for TechCorp Solutions. It supports up to 100 users and includes advanced features like custom integrations, dedicated support, and enterprise-grade security. What's your timeline for implementation?",
                    timestamp: new Date(
                        Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60 * 5
                    ),
                    platform_message_id: "msg_007",
                    attachments: null,
                    created_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60 * 5
                    ),
                    updated_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 4 + 1000 * 60 * 5
                    ),
                },
                {
                    id: 8,
                    conversation_id: 2,
                    sender_type: "customer",
                    message_text:
                        "We need to implement this within the next month. Our current system is causing too many issues. What are the pricing options?",
                    timestamp: new Date(Date.now() - 1000 * 60 * 10),
                    platform_message_id: "msg_008",
                    attachments: null,
                    created_at: new Date(Date.now() - 1000 * 60 * 10),
                    updated_at: new Date(Date.now() - 1000 * 60 * 10),
                },

                // Conversation 3 - Mike Johnson (initial contact)
                {
                    id: 9,
                    conversation_id: 3,
                    sender_type: "customer",
                    message_text:
                        "Hello! I'm starting a new startup and looking for business solutions.",
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
                    platform_message_id: "msg_009",
                    attachments: null,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6),
                    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6),
                },
                {
                    id: 10,
                    conversation_id: 3,
                    sender_type: "bot",
                    message_text:
                        "Hi Mike! Congratulations on starting your startup! We have great solutions for startups. What type of business are you starting?",
                    timestamp: new Date(
                        Date.now() - 1000 * 60 * 60 * 6 + 1000 * 60 * 5
                    ),
                    platform_message_id: "msg_010",
                    attachments: null,
                    created_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 6 + 1000 * 60 * 5
                    ),
                    updated_at: new Date(
                        Date.now() - 1000 * 60 * 60 * 6 + 1000 * 60 * 5
                    ),
                },
                {
                    id: 11,
                    conversation_id: 3,
                    sender_type: "customer",
                    message_text:
                        "We're building a fintech app. Still figuring out what tools we need.",
                    timestamp: new Date(Date.now() - 1000 * 60 * 60),
                    platform_message_id: "msg_011",
                    attachments: null,
                    created_at: new Date(Date.now() - 1000 * 60 * 60),
                    updated_at: new Date(Date.now() - 1000 * 60 * 60),
                },

                // Conversation 4 - Sarah Wilson (ready to convert)
                {
                    id: 12,
                    conversation_id: 4,
                    sender_type: "customer",
                    message_text:
                        "We've reviewed all the proposals and your platform is exactly what we need. When can we get started?",
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    platform_message_id: "msg_012",
                    attachments: null,
                    created_at: new Date(Date.now() - 1000 * 60 * 5),
                    updated_at: new Date(Date.now() - 1000 * 60 * 5),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("messages", null, {});
    },
};
