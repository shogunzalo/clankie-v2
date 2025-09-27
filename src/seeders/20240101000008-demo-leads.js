"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "leads",
            [
                {
                    id: 1,
                    client_id: 2,
                    conversation_id: 2,
                    lead_score: 95,
                    status: "qualified",
                    source: "instagram",
                    notes: "Enterprise customer with urgent timeline. High budget, decision maker engaged.",
                    expected_value: 50000.0,
                    probability: 0.85,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4),
                    updated_at: new Date(Date.now() - 1000 * 60 * 10),
                },
                {
                    id: 2,
                    client_id: 4,
                    conversation_id: 4,
                    lead_score: 98,
                    status: "ready_to_convert",
                    source: "whatsapp",
                    notes: "Ready to sign contract. All requirements met, budget approved.",
                    expected_value: 75000.0,
                    probability: 0.95,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8),
                    updated_at: new Date(Date.now() - 1000 * 60 * 5),
                },
                {
                    id: 3,
                    client_id: 1,
                    conversation_id: 1,
                    lead_score: 85,
                    status: "interested",
                    source: "instagram",
                    notes: "Interested in AI features. Scheduling demo this week.",
                    expected_value: 25000.0,
                    probability: 0.7,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    updated_at: new Date(Date.now() - 1000 * 60 * 30),
                },
                {
                    id: 4,
                    client_id: 3,
                    conversation_id: 3,
                    lead_score: 60,
                    status: "prospecting",
                    source: "instagram",
                    notes: "Early stage startup. Needs guidance on requirements.",
                    expected_value: 15000.0,
                    probability: 0.4,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6),
                    updated_at: new Date(Date.now() - 1000 * 60 * 60),
                },
                {
                    id: 5,
                    client_id: 5,
                    conversation_id: 5,
                    lead_score: 20,
                    status: "lost",
                    source: "instagram",
                    notes: "Budget constraints. Not a good fit for current solution.",
                    expected_value: 0.0,
                    probability: 0.0,
                    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
                    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("leads", null, {});
    },
};
