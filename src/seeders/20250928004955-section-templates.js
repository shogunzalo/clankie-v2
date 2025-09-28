"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create section templates
        const templates = [
            {
                section_key: "about_company",
                is_required: true,
                display_order: 1,
                character_min: 0,
                character_max: 2000,
                created_at: new Date(),
            },
            {
                section_key: "services",
                is_required: true,
                display_order: 2,
                character_min: 0,
                character_max: 3000,
                created_at: new Date(),
            },
            {
                section_key: "policies",
                is_required: false,
                display_order: 3,
                character_min: 0,
                character_max: 2500,
                created_at: new Date(),
            },
            {
                section_key: "process",
                is_required: false,
                display_order: 4,
                character_min: 0,
                character_max: 2000,
                created_at: new Date(),
            },
            {
                section_key: "unique_value",
                is_required: false,
                display_order: 5,
                character_min: 0,
                character_max: 1500,
                created_at: new Date(),
            },
            {
                section_key: "free_form",
                is_required: false,
                display_order: 6,
                character_min: 0,
                character_max: 5000,
                created_at: new Date(),
            },
        ];

        const createdTemplates = await queryInterface.bulkInsert(
            "section_templates",
            templates,
            { returning: ["id", "section_key"] }
        );

        // Create translations for English and Spanish
        const translations = [];

        // English translations
        const englishTranslations = [
            {
                template_id: 1,
                language_code: "en",
                section_name: "About Company",
                description:
                    "Tell customers about your company, its history, mission, and what makes you unique.",
                placeholder_text:
                    "Describe your company's story, mission, and what sets you apart from competitors...",
                example_content:
                    "Founded in 2020, TechFlow Solutions is a leading technology company specializing in web development and digital transformation. Our mission is to empower businesses through innovative technology solutions.",
            },
            {
                template_id: 2,
                language_code: "en",
                section_name: "Services",
                description:
                    "List and describe the services you offer to customers.",
                placeholder_text:
                    "Describe your main services, pricing, and how customers can get started...",
                example_content:
                    "We offer comprehensive web development services including custom websites, e-commerce platforms, mobile apps, and ongoing maintenance support.",
            },
            {
                template_id: 3,
                language_code: "en",
                section_name: "Policies",
                description:
                    "Outline your business policies, terms of service, and important guidelines.",
                placeholder_text:
                    "Describe your policies regarding returns, cancellations, privacy, and other important terms...",
                example_content:
                    "We offer a 30-day money-back guarantee on all services. All projects include 3 months of free support and maintenance.",
            },
            {
                template_id: 4,
                language_code: "en",
                section_name: "Process",
                description:
                    "Explain your workflow, how you work with clients, and what to expect.",
                placeholder_text:
                    "Describe your typical project workflow, timelines, and what clients can expect...",
                example_content:
                    "Our process begins with a consultation to understand your needs, followed by project planning, development, testing, and deployment.",
            },
            {
                template_id: 5,
                language_code: "en",
                section_name: "Unique Value",
                description:
                    "Highlight what makes your business special and why customers should choose you.",
                placeholder_text:
                    "Explain what makes your business unique and why customers should choose you...",
                example_content:
                    "What sets us apart is our focus on user experience, cutting-edge technology, and personalized service. We're not just developers, we're your digital partners.",
            },
            {
                template_id: 6,
                language_code: "en",
                section_name: "Free Form",
                description:
                    "Add any additional information that doesn't fit in the other categories.",
                placeholder_text:
                    "Add any additional information about your business...",
                example_content:
                    "We're proud to be certified by major technology partners and have received industry recognition for our innovative solutions.",
            },
        ];

        // Spanish translations
        const spanishTranslations = [
            {
                template_id: 1,
                language_code: "es",
                section_name: "Acerca de la Empresa",
                description:
                    "Cuéntale a los clientes sobre tu empresa, su historia, misión y qué te hace único.",
                placeholder_text:
                    "Describe la historia de tu empresa, su misión y qué te diferencia de la competencia...",
                example_content:
                    "Fundada en 2020, TechFlow Solutions es una empresa líder en tecnología especializada en desarrollo web y transformación digital. Nuestra misión es empoderar a las empresas a través de soluciones tecnológicas innovadoras.",
            },
            {
                template_id: 2,
                language_code: "es",
                section_name: "Servicios",
                description:
                    "Lista y describe los servicios que ofreces a los clientes.",
                placeholder_text:
                    "Describe tus principales servicios, precios y cómo los clientes pueden comenzar...",
                example_content:
                    "Ofrecemos servicios completos de desarrollo web incluyendo sitios web personalizados, plataformas de comercio electrónico, aplicaciones móviles y soporte de mantenimiento continuo.",
            },
            {
                template_id: 3,
                language_code: "es",
                section_name: "Políticas",
                description:
                    "Describe tus políticas comerciales, términos de servicio y pautas importantes.",
                placeholder_text:
                    "Describe tus políticas sobre devoluciones, cancelaciones, privacidad y otros términos importantes...",
                example_content:
                    "Ofrecemos una garantía de devolución de dinero de 30 días en todos los servicios. Todos los proyectos incluyen 3 meses de soporte y mantenimiento gratuito.",
            },
            {
                template_id: 4,
                language_code: "es",
                section_name: "Proceso",
                description:
                    "Explica tu flujo de trabajo, cómo trabajas con clientes y qué esperar.",
                placeholder_text:
                    "Describe tu flujo de trabajo típico del proyecto, cronogramas y qué pueden esperar los clientes...",
                example_content:
                    "Nuestro proceso comienza con una consulta para entender tus necesidades, seguido de planificación del proyecto, desarrollo, pruebas y despliegue.",
            },
            {
                template_id: 5,
                language_code: "es",
                section_name: "Valor Único",
                description:
                    "Destaca qué hace especial a tu negocio y por qué los clientes deberían elegirte.",
                placeholder_text:
                    "Explica qué hace único a tu negocio y por qué los clientes deberían elegirte...",
                example_content:
                    "Lo que nos diferencia es nuestro enfoque en la experiencia del usuario, tecnología de vanguardia y servicio personalizado. No somos solo desarrolladores, somos tus socios digitales.",
            },
            {
                template_id: 6,
                language_code: "es",
                section_name: "Formato Libre",
                description:
                    "Agrega cualquier información adicional que no encaje en las otras categorías.",
                placeholder_text:
                    "Agrega cualquier información adicional sobre tu negocio...",
                example_content:
                    "Estamos orgullosos de estar certificados por los principales socios tecnológicos y haber recibido reconocimiento de la industria por nuestras soluciones innovadoras.",
            },
        ];

        translations.push(...englishTranslations, ...spanishTranslations);

        await queryInterface.bulkInsert(
            "section_template_translations",
            translations
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete(
            "section_template_translations",
            null,
            {}
        );
        await queryInterface.bulkDelete("section_templates", null, {});
    },
};
