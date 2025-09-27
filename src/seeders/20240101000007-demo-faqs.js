"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "faq_items",
            [
                {
                    id: 1,
                    business_id: "biz_12345678",
                    question: "What are your pricing options?",
                    answer: "We offer three pricing tiers: Basic ($99/month), Premium ($199/month), and Enterprise ($399/month). Each tier includes different features and support levels.",
                    category: "pricing",
                    is_active: true,
                    usage_count: 45,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 2,
                    business_id: "biz_12345678",
                    question: "Do you offer custom integrations?",
                    answer: "Yes, our Enterprise plan includes custom integrations with your existing systems. We support APIs, webhooks, and custom connectors.",
                    category: "technical",
                    is_active: true,
                    usage_count: 23,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 3,
                    business_id: "biz_12345678",
                    question: "What is your implementation timeline?",
                    answer: "Implementation typically takes 2-4 weeks depending on your requirements. We provide a detailed project plan and regular updates throughout the process.",
                    category: "process",
                    is_active: true,
                    usage_count: 18,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 4,
                    business_id: "biz_12345678",
                    question: "Do you provide training and support?",
                    answer: "Yes, all plans include comprehensive training materials and support. Enterprise customers get dedicated account management and priority support.",
                    category: "support",
                    is_active: true,
                    usage_count: 32,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 5,
                    business_id: "biz_87654321",
                    question: "What payment methods do you accept?",
                    answer: "We accept all major credit cards, PayPal, and bank transfers. Enterprise customers can also pay via invoice.",
                    category: "billing",
                    is_active: true,
                    usage_count: 28,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 6,
                    business_id: "biz_87654321",
                    question: "Can I cancel my subscription anytime?",
                    answer: "Yes, you can cancel your subscription at any time. There are no cancellation fees, and you'll retain access until the end of your billing period.",
                    category: "billing",
                    is_active: true,
                    usage_count: 15,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 7,
                    business_id: "biz_11111111",
                    question: "What industries do you serve?",
                    answer: "We serve a wide range of industries including technology, healthcare, finance, retail, and manufacturing. Our solutions are customizable for specific industry needs.",
                    category: "general",
                    is_active: true,
                    usage_count: 21,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 8,
                    business_id: "biz_11111111",
                    question: "Do you offer a free trial?",
                    answer: "Yes, we offer a 14-day free trial for all new customers. No credit card required to start your trial.",
                    category: "trial",
                    is_active: true,
                    usage_count: 67,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("faq_items", null, {});
    },
};
