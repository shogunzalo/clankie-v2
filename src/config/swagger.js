const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Clankie API",
            version: "1.0.0",
            description:
                "AI-powered business communication platform API documentation",
            contact: {
                name: "Clankie Team",
                email: "support@clankie.com",
            },
            license: {
                name: "MIT",
                url: "https://opensource.org/licenses/MIT",
            },
        },
        servers: [
            {
                url: process.env.API_BASE_URL || "http://localhost:3000",
                description: "Development server",
            },
            {
                url: "https://api.clankie.com",
                description: "Production server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "Firebase ID Token - Get this from Firebase Auth on the frontend",
                },
            },
            schemas: {
                Error: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        error: {
                            type: "string",
                            description: "Error message",
                            example: "Resource not found",
                        },
                        code: {
                            type: "string",
                            description: "Error code",
                            example: "NOT_FOUND",
                        },
                        details: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    field: {
                                        type: "string",
                                    },
                                    message: {
                                        type: "string",
                                    },
                                },
                            },
                        },
                    },
                },
                Success: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: true,
                        },
                        data: {
                            type: "object",
                            description: "Response data",
                        },
                        message: {
                            type: "string",
                            description: "Success message",
                        },
                    },
                },
                Business: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Business ID",
                            example: 1,
                        },
                        company_name: {
                            type: "string",
                            description: "Company name",
                            example: "TechFlow Solutions",
                        },
                        business_type: {
                            type: "string",
                            description: "Type of business",
                            example: "technology",
                        },
                        owner_name: {
                            type: "string",
                            description: "Business owner name",
                            example: "John Doe",
                        },
                        owner_email: {
                            type: "string",
                            format: "email",
                            description: "Business email",
                            example: "contact@techflow.com",
                        },
                        phone: {
                            type: "string",
                            description: "Business phone number",
                            example: "+1-555-0123",
                        },
                        website: {
                            type: "string",
                            format: "uri",
                            description: "Business website",
                            example: "https://techflow.com",
                        },
                        primary_language: {
                            type: "string",
                            description: "Primary language",
                            example: "en",
                        },
                        auto_detect_language: {
                            type: "boolean",
                            description: "Auto-detect language",
                            example: true,
                        },
                        timezone: {
                            type: "string",
                            description: "Business timezone",
                            example: "America/New_York",
                        },
                        subscription_plan: {
                            type: "string",
                            description: "Subscription plan",
                            example: "premium",
                        },
                        subscription_status: {
                            type: "string",
                            description: "Subscription status",
                            example: "active",
                        },
                        onboarding_completed: {
                            type: "boolean",
                            description: "Onboarding completed",
                            example: true,
                        },
                        setup_step: {
                            type: "string",
                            description: "Current setup step",
                            example: "completed",
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "Creation timestamp",
                        },
                        updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                    },
                },
                BusinessInfo: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Business ID",
                            example: 1,
                        },
                        company_name: {
                            type: "string",
                            description: "Company name",
                            example: "TechFlow Solutions",
                        },
                        business_type: {
                            type: "string",
                            description: "Type of business",
                            example: "technology",
                        },
                        owner_name: {
                            type: "string",
                            description: "Business owner name",
                            example: "John Doe",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "Business email",
                            example: "contact@techflow.com",
                        },
                        phone: {
                            type: "string",
                            description: "Business phone number",
                            example: "+1-555-0123",
                        },
                        website: {
                            type: "string",
                            format: "uri",
                            description: "Business website",
                            example: "https://techflow.com",
                        },
                        address: {
                            type: "string",
                            description: "Business address",
                            example: "123 Tech Street",
                        },
                        city: {
                            type: "string",
                            description: "City",
                            example: "San Francisco",
                        },
                        state: {
                            type: "string",
                            description: "State",
                            example: "CA",
                        },
                        country: {
                            type: "string",
                            description: "Country",
                            example: "USA",
                        },
                        postal_code: {
                            type: "string",
                            description: "Postal code",
                            example: "94105",
                        },
                        primary_language: {
                            type: "string",
                            description: "Primary language",
                            example: "en",
                        },
                        auto_detect_language: {
                            type: "boolean",
                            description: "Auto-detect language",
                            example: true,
                        },
                        timezone: {
                            type: "string",
                            description: "Business timezone",
                            example: "America/New_York",
                        },
                        subscription_plan: {
                            type: "string",
                            description: "Subscription plan",
                            example: "premium",
                        },
                        subscription_status: {
                            type: "string",
                            description: "Subscription status",
                            example: "active",
                        },
                        onboarding_completed: {
                            type: "boolean",
                            description: "Onboarding completed",
                            example: true,
                        },
                        setup_step: {
                            type: "integer",
                            description: "Current setup step",
                            example: 5,
                        },
                    },
                },
                FaqItem: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "FAQ ID",
                            example: 1,
                        },
                        question: {
                            type: "string",
                            description: "FAQ question",
                            example:
                                "How long does a typical web development project take?",
                        },
                        answer: {
                            type: "string",
                            description: "FAQ answer",
                            example:
                                "A typical web development project takes 4-8 weeks depending on complexity.",
                        },
                        category: {
                            type: "string",
                            description: "FAQ category",
                            example: "timeline",
                        },
                        language_code: {
                            type: "string",
                            description: "Language code",
                            example: "en",
                        },
                        is_active: {
                            type: "boolean",
                            description: "Is FAQ active",
                            example: true,
                        },
                        usage_count: {
                            type: "integer",
                            description: "Number of times FAQ was used",
                            example: 15,
                        },
                        success_rate: {
                            type: "number",
                            format: "float",
                            description: "Success rate (0-1)",
                            example: 0.85,
                        },
                        last_used: {
                            type: "string",
                            format: "date-time",
                            description: "Last used timestamp",
                        },
                        keywords: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/FaqKeyword",
                            },
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "Creation timestamp",
                        },
                        updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                    },
                },
                FaqKeyword: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Keyword ID",
                            example: 1,
                        },
                        keyword: {
                            type: "string",
                            description: "Keyword text",
                            example: "timeline",
                        },
                        weight: {
                            type: "number",
                            format: "float",
                            description: "Keyword weight",
                            example: 1.0,
                        },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "User ID",
                            example: 1,
                        },
                        firebase_uid: {
                            type: "string",
                            description: "Firebase UID",
                            example: "abc123def456",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email",
                            example: "user@example.com",
                        },
                        display_name: {
                            type: "string",
                            description: "Display name",
                            example: "John Doe",
                        },
                        photo_url: {
                            type: "string",
                            format: "uri",
                            description: "Photo URL",
                            example: "https://example.com/photo.jpg",
                        },
                        roles: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "User roles",
                            example: ["user", "admin"],
                        },
                        is_active: {
                            type: "boolean",
                            description: "Is user active",
                            example: true,
                        },
                        last_login: {
                            type: "string",
                            format: "date-time",
                            description: "Last login timestamp",
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "Creation timestamp",
                        },
                        updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                    },
                },
                TemplateWithStatus: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Template ID",
                            example: 1,
                        },
                        section_key: {
                            type: "string",
                            description: "Template section key",
                            example: "about_company",
                        },
                        section_name: {
                            type: "string",
                            description: "Template section name",
                            example: "About Company",
                        },
                        description: {
                            type: "string",
                            description: "Template description",
                            example: "Tell customers about your company...",
                        },
                        placeholder_text: {
                            type: "string",
                            description: "Placeholder text for the template",
                            example: "Describe your company's story...",
                        },
                        example_content: {
                            type: "string",
                            description: "Example content for the template",
                            example: "Founded in 2020, TechFlow Solutions...",
                        },
                        is_required: {
                            type: "boolean",
                            description: "Whether template is required",
                            example: true,
                        },
                        display_order: {
                            type: "integer",
                            description: "Display order",
                            example: 1,
                        },
                        character_min: {
                            type: "integer",
                            description: "Minimum character count",
                            example: 100,
                        },
                        character_max: {
                            type: "integer",
                            description: "Maximum character count",
                            example: 2000,
                        },
                        completion_status: {
                            type: "string",
                            enum: ["not_started", "in_progress", "completed"],
                            description: "Completion status",
                            example: "completed",
                        },
                        character_count: {
                            type: "integer",
                            description: "Current character count",
                            example: 150,
                        },
                        word_count: {
                            type: "integer",
                            description: "Current word count",
                            example: 25,
                        },
                        progress_percentage: {
                            type: "integer",
                            description: "Progress percentage",
                            example: 75,
                        },
                        search_hits: {
                            type: "integer",
                            description: "Number of search hits",
                            example: 12,
                        },
                        last_accessed: {
                            type: "string",
                            format: "date-time",
                            description: "Last accessed timestamp",
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "Creation timestamp",
                        },
                        updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                    },
                },
                TemplateResponse: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Response ID",
                            example: 1,
                        },
                        business_id: {
                            type: "integer",
                            description: "Business ID",
                            example: 1,
                        },
                        template_id: {
                            type: "integer",
                            description: "Template ID",
                            example: 1,
                        },
                        language_code: {
                            type: "string",
                            description: "Language code",
                            example: "en",
                        },
                        content: {
                            type: "string",
                            description: "Response content",
                            example: "Founded in 2020, TechFlow Solutions...",
                        },
                        content_embedding: {
                            type: "array",
                            description: "Content embedding vector",
                        },
                        embedding_model: {
                            type: "string",
                            description: "Embedding model used",
                            example: "text-embedding-ada-002",
                        },
                        embedding_updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "Embedding update timestamp",
                        },
                        character_count: {
                            type: "integer",
                            description: "Character count",
                            example: 150,
                        },
                        word_count: {
                            type: "integer",
                            description: "Word count",
                            example: 25,
                        },
                        completion_status: {
                            type: "string",
                            enum: ["not_started", "in_progress", "completed"],
                            description: "Completion status",
                            example: "completed",
                        },
                        search_hits: {
                            type: "integer",
                            description: "Number of search hits",
                            example: 12,
                        },
                        last_accessed: {
                            type: "string",
                            format: "date-time",
                            description: "Last accessed timestamp",
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "Creation timestamp",
                        },
                        updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                    },
                },
                ContextSection: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Context section ID",
                            example: 1,
                        },
                        business_id: {
                            type: "integer",
                            description: "Business ID",
                            example: 1,
                        },
                        section_type: {
                            type: "string",
                            description: "Section type",
                            example: "custom",
                        },
                        section_key: {
                            type: "string",
                            description: "Section key",
                            example: "custom_1234567890",
                        },
                        language_code: {
                            type: "string",
                            description: "Language code",
                            example: "en",
                        },
                        section_name: {
                            type: "string",
                            description: "Section name",
                            example: "Our Team",
                        },
                        content: {
                            type: "string",
                            description: "Section content",
                            example:
                                "Meet our talented team of professionals...",
                        },
                        content_embedding: {
                            type: "array",
                            description: "Content embedding vector",
                        },
                        embedding_model: {
                            type: "string",
                            description: "Embedding model used",
                            example: "text-embedding-ada-002",
                        },
                        embedding_updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "Embedding update timestamp",
                        },
                        is_active: {
                            type: "boolean",
                            description: "Whether section is active",
                            example: true,
                        },
                        display_order: {
                            type: "integer",
                            description: "Display order",
                            example: 1,
                        },
                        character_count: {
                            type: "integer",
                            description: "Character count",
                            example: 150,
                        },
                        word_count: {
                            type: "integer",
                            description: "Word count",
                            example: 25,
                        },
                        completion_status: {
                            type: "string",
                            enum: ["not_started", "in_progress", "completed"],
                            description: "Completion status",
                            example: "completed",
                        },
                        search_hits: {
                            type: "integer",
                            description: "Number of search hits",
                            example: 12,
                        },
                        last_accessed: {
                            type: "string",
                            format: "date-time",
                            description: "Last accessed timestamp",
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "Creation timestamp",
                        },
                        updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "Last update timestamp",
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: "Authentication",
                description: "Firebase authentication endpoints",
            },
            {
                name: "Business",
                description: "Business management endpoints",
            },
            {
                name: "Business Public",
                description: "Public business information endpoints",
            },
            {
                name: "Business Admin",
                description: "Business administration endpoints",
            },
            {
                name: "Business Settings",
                description: "Business settings management endpoints",
            },
            {
                name: "FAQ",
                description: "FAQ management endpoints",
            },
            {
                name: "Conversation",
                description: "Conversation management endpoints",
            },
            {
                name: "Message",
                description: "Message management endpoints",
            },
            {
                name: "Client",
                description: "Client management endpoints",
            },
            {
                name: "User",
                description: "User management endpoints",
            },
            {
                name: "Health",
                description: "Health check endpoints",
            },
            {
                name: "Business Templates",
                description: "Template-based content endpoints",
            },
            {
                name: "Business Contexts",
                description: "Custom context sections endpoints",
            },
        ],
    },
    apis: [
        path.join(__dirname, "../routes/*.js"),
        path.join(__dirname, "../controllers/*.js"),
        path.join(__dirname, "../app.js"),
    ],
};

const specs = swaggerJSDoc(options);

module.exports = specs;
