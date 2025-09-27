"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "services",
            [
                {
                    id: 1,
                    business_id: "biz_12345678",
                    name: "Web Development",
                    description:
                        "Custom web development services including frontend, backend, and full-stack solutions",
                    category: "development",
                    price: 5000.0,
                    is_active: true,
                    display_order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 2,
                    business_id: "biz_12345678",
                    name: "Mobile App Development",
                    description:
                        "Native and cross-platform mobile application development for iOS and Android",
                    category: "development",
                    price: 8000.0,
                    is_active: true,
                    display_order: 2,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 3,
                    business_id: "biz_12345678",
                    name: "AI Integration",
                    description:
                        "Artificial Intelligence integration services including machine learning and automation",
                    category: "ai",
                    price: 12000.0,
                    is_active: true,
                    display_order: 3,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 4,
                    business_id: "biz_87654321",
                    name: "E-commerce Platform",
                    description:
                        "Complete e-commerce solution with payment processing, inventory management, and analytics",
                    category: "ecommerce",
                    price: 15000.0,
                    is_active: true,
                    display_order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 5,
                    business_id: "biz_87654321",
                    name: "Digital Marketing",
                    description:
                        "Comprehensive digital marketing services including SEO, PPC, and social media management",
                    category: "marketing",
                    price: 3000.0,
                    is_active: true,
                    display_order: 2,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 6,
                    business_id: "biz_11111111",
                    name: "Consulting Services",
                    description:
                        "Business consulting and strategy development services",
                    category: "consulting",
                    price: 2000.0,
                    is_active: true,
                    display_order: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 7,
                    business_id: "biz_11111111",
                    name: "Training & Support",
                    description:
                        "Comprehensive training programs and ongoing technical support",
                    category: "support",
                    price: 1500.0,
                    is_active: true,
                    display_order: 2,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("services", null, {});
    },
};
