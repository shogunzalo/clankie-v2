const swaggerJSDoc = require("swagger-jsdoc");

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
                url: process.env.FRONTEND_URL || "http://localhost:3000",
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
                Business: {
                    type: "object",
                    required: ["company_name", "owner_email"],
                    properties: {
                        id: {
                            type: "string",
                            description: "Unique business identifier",
                            example: "biz_12345678",
                        },
                        company_name: {
                            type: "string",
                            description: "Company name",
                            example: "Acme Corp",
                        },
                        owner_email: {
                            type: "string",
                            format: "email",
                            description: "Owner email address",
                            example: "owner@acme.com",
                        },
                        industry: {
                            type: "string",
                            description: "Business industry",
                            example: "Technology",
                        },
                        business_type: {
                            type: "string",
                            enum: [
                                "SaaS",
                                "E-commerce",
                                "Service",
                                "Manufacturing",
                                "Other",
                            ],
                            description: "Type of business",
                            example: "SaaS",
                        },
                        plan_type: {
                            type: "string",
                            enum: ["basic", "premium", "enterprise"],
                            description: "Subscription plan type",
                            example: "premium",
                        },
                        is_active: {
                            type: "boolean",
                            description: "Whether the business is active",
                            example: true,
                        },
                        settings: {
                            type: "object",
                            description: "Business-specific settings",
                        },
                    },
                },
                Client: {
                    type: "object",
                    required: ["platform_user_id", "business_id"],
                    properties: {
                        id: {
                            type: "integer",
                            description: "Client ID",
                            example: 1,
                        },
                        platform_user_id: {
                            type: "string",
                            description: "Platform-specific user ID",
                            example: "user_123",
                        },
                        business_id: {
                            type: "string",
                            description: "Associated business ID",
                            example: "biz_12345678",
                        },
                        contact_name: {
                            type: "string",
                            description: "Client contact name",
                            example: "John Doe",
                        },
                        contact_email: {
                            type: "string",
                            format: "email",
                            description: "Client email address",
                            example: "john@example.com",
                        },
                        company_name: {
                            type: "string",
                            description: "Client company name",
                            example: "Client Corp",
                        },
                        business_type: {
                            type: "string",
                            description: "Client business type",
                            example: "Individual",
                        },
                        plan_type: {
                            type: "string",
                            enum: ["basic", "premium", "enterprise"],
                            description: "Client plan type",
                            example: "basic",
                        },
                        status: {
                            type: "string",
                            enum: ["active", "inactive", "suspended"],
                            description: "Client status",
                            example: "active",
                        },
                        engagement_score: {
                            type: "number",
                            minimum: 0,
                            maximum: 100,
                            description: "Client engagement score",
                            example: 75,
                        },
                    },
                },
                Conversation: {
                    type: "object",
                    required: ["client_id", "platform_source_id"],
                    properties: {
                        id: {
                            type: "integer",
                            description: "Conversation ID",
                            example: 1,
                        },
                        client_id: {
                            type: "integer",
                            description: "Associated client ID",
                            example: 1,
                        },
                        platform_source_id: {
                            type: "integer",
                            description: "Platform source ID",
                            example: 1,
                        },
                        current_state: {
                            type: "string",
                            enum: [
                                "initial_contact",
                                "engaged",
                                "interested",
                                "qualified",
                                "ready_to_convert",
                                "objection",
                                "lost",
                            ],
                            description: "Current conversation state",
                            example: "interested",
                        },
                        is_active: {
                            type: "boolean",
                            description: "Whether conversation is active",
                            example: true,
                        },
                        message_count: {
                            type: "integer",
                            description: "Total message count",
                            example: 5,
                        },
                        last_message_at: {
                            type: "string",
                            format: "date-time",
                            description: "Last message timestamp",
                            example: "2024-01-15T10:30:00Z",
                        },
                        lead_score: {
                            type: "number",
                            minimum: 0,
                            maximum: 100,
                            description: "Lead score",
                            example: 85,
                        },
                        sentiment_score: {
                            type: "number",
                            minimum: -1,
                            maximum: 1,
                            description: "Sentiment score",
                            example: 0.7,
                        },
                    },
                },
                Message: {
                    type: "object",
                    required: [
                        "conversation_id",
                        "sender_type",
                        "message_text",
                    ],
                    properties: {
                        id: {
                            type: "integer",
                            description: "Message ID",
                            example: 1,
                        },
                        conversation_id: {
                            type: "integer",
                            description: "Associated conversation ID",
                            example: 1,
                        },
                        sender_type: {
                            type: "string",
                            enum: ["customer", "bot", "agent"],
                            description: "Message sender type",
                            example: "customer",
                        },
                        message_text: {
                            type: "string",
                            description: "Message content",
                            example: "Hello, I'm interested in your services",
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                            description: "Message timestamp",
                            example: "2024-01-15T10:30:00Z",
                        },
                        platform_message_id: {
                            type: "string",
                            description: "Platform-specific message ID",
                            example: "msg_123",
                        },
                        attachments: {
                            type: "array",
                            items: {
                                type: "object",
                            },
                            description: "Message attachments",
                        },
                    },
                },
                FAQItem: {
                    type: "object",
                    required: ["business_id", "question", "answer"],
                    properties: {
                        id: {
                            type: "integer",
                            description: "FAQ item ID",
                            example: 1,
                        },
                        business_id: {
                            type: "string",
                            description: "Associated business ID",
                            example: "biz_12345678",
                        },
                        question: {
                            type: "string",
                            description: "FAQ question",
                            example: "What are your pricing options?",
                        },
                        answer: {
                            type: "string",
                            description: "FAQ answer",
                            example:
                                "We offer three pricing tiers: Basic, Premium, and Enterprise.",
                        },
                        category: {
                            type: "string",
                            description: "FAQ category",
                            example: "pricing",
                        },
                        is_active: {
                            type: "boolean",
                            description: "Whether FAQ is active",
                            example: true,
                        },
                        usage_count: {
                            type: "integer",
                            description:
                                "Number of times this FAQ has been used",
                            example: 25,
                        },
                    },
                },
                Service: {
                    type: "object",
                    required: ["business_id", "name", "description"],
                    properties: {
                        id: {
                            type: "integer",
                            description: "Service ID",
                            example: 1,
                        },
                        business_id: {
                            type: "string",
                            description: "Associated business ID",
                            example: "biz_12345678",
                        },
                        name: {
                            type: "string",
                            description: "Service name",
                            example: "Web Development",
                        },
                        description: {
                            type: "string",
                            description: "Service description",
                            example: "Custom web development services",
                        },
                        category: {
                            type: "string",
                            description: "Service category",
                            example: "development",
                        },
                        price: {
                            type: "number",
                            description: "Service price",
                            example: 5000,
                        },
                        is_active: {
                            type: "boolean",
                            description: "Whether service is active",
                            example: true,
                        },
                        display_order: {
                            type: "integer",
                            description: "Display order",
                            example: 1,
                        },
                    },
                },
                PlatformSource: {
                    type: "object",
                    required: ["business_id", "platform_type", "name"],
                    properties: {
                        id: {
                            type: "integer",
                            description: "Platform source ID",
                            example: 1,
                        },
                        business_id: {
                            type: "string",
                            description: "Associated business ID",
                            example: "biz_12345678",
                        },
                        platform_type: {
                            type: "string",
                            enum: [
                                "instagram",
                                "whatsapp",
                                "facebook",
                                "telegram",
                            ],
                            description: "Platform type",
                            example: "instagram",
                        },
                        name: {
                            type: "string",
                            description: "Platform source name",
                            example: "Instagram Business",
                        },
                        is_active: {
                            type: "boolean",
                            description: "Whether platform is active",
                            example: true,
                        },
                        credentials: {
                            type: "object",
                            description:
                                "Platform credentials (hidden in responses)",
                        },
                        webhook_url: {
                            type: "string",
                            format: "uri",
                            description: "Webhook URL",
                            example:
                                "https://api.clankie.com/webhooks/instagram/webhook",
                        },
                    },
                },
                UnansweredQuestion: {
                    type: "object",
                    required: ["conversation_id", "question_text"],
                    properties: {
                        id: {
                            type: "integer",
                            description: "Unanswered question ID",
                            example: 1,
                        },
                        conversation_id: {
                            type: "integer",
                            description: "Associated conversation ID",
                            example: 1,
                        },
                        question_text: {
                            type: "string",
                            description: "The unanswered question",
                            example: "What's your API rate limit?",
                        },
                        question_type: {
                            type: "string",
                            enum: ["technical", "pricing", "legal", "general"],
                            description: "Type of question",
                            example: "technical",
                        },
                        priority: {
                            type: "string",
                            enum: ["low", "medium", "high", "urgent"],
                            description: "Question priority",
                            example: "high",
                        },
                        status: {
                            type: "string",
                            enum: ["pending", "in_progress", "resolved"],
                            description: "Question status",
                            example: "pending",
                        },
                        context: {
                            type: "string",
                            description: "Additional context",
                            example:
                                "Customer asking about API limitations for enterprise plan",
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "Creation timestamp",
                            example: "2024-01-15T10:30:00Z",
                        },
                    },
                },
                User: {
                    type: "object",
                    required: ["firebase_uid", "email", "roles"],
                    properties: {
                        id: {
                            type: "integer",
                            description: "Internal user ID",
                            example: 1,
                        },
                        firebase_uid: {
                            type: "string",
                            description: "Firebase user ID",
                            example: "firebase_uid_123456789",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User's email address",
                            example: "user@example.com",
                        },
                        display_name: {
                            type: "string",
                            description: "User's display name",
                            example: "John Doe",
                        },
                        photo_url: {
                            type: "string",
                            format: "uri",
                            description: "User's profile photo URL",
                            example: "https://example.com/photo.jpg",
                        },
                        roles: {
                            type: "array",
                            items: {
                                type: "string",
                                enum: [
                                    "user",
                                    "admin",
                                    "business_owner",
                                    "agent",
                                ],
                            },
                            description: "User roles",
                            example: ["user", "business_owner"],
                        },
                        metadata: {
                            type: "object",
                            description: "Additional user metadata",
                            example: {
                                email_verified: true,
                                firebase_sign_in_provider: "google.com",
                                created_via: "firebase_auth",
                            },
                        },
                        is_active: {
                            type: "boolean",
                            description: "Whether the user is active",
                            example: true,
                        },
                        last_login: {
                            type: "string",
                            format: "date-time",
                            description: "Last login timestamp",
                            example: "2024-01-15T10:30:00.000Z",
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "User creation timestamp",
                            example: "2024-01-01T00:00:00.000Z",
                        },
                        updated_at: {
                            type: "string",
                            format: "date-time",
                            description: "User last update timestamp",
                            example: "2024-01-15T10:30:00.000Z",
                        },
                    },
                },
                ContactInfo: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Contact info ID",
                            example: 1,
                        },
                        info_type: {
                            type: "string",
                            enum: [
                                "phone",
                                "email",
                                "address",
                                "website",
                                "social",
                            ],
                            description: "Type of contact information",
                            example: "phone",
                        },
                        label: {
                            type: "string",
                            description: "Display label for the contact info",
                            example: "Main Phone",
                        },
                        value: {
                            type: "string",
                            description: "Contact information value",
                            example: "+1-555-0123",
                        },
                        is_primary: {
                            type: "boolean",
                            description:
                                "Whether this is the primary contact method",
                            example: true,
                        },
                    },
                },
                Service: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Service ID",
                            example: 1,
                        },
                        service_name: {
                            type: "string",
                            description: "Name of the service",
                            example: "Web Development",
                        },
                        description: {
                            type: "string",
                            description: "Service description",
                            example:
                                "Custom website development using modern technologies",
                        },
                        price: {
                            type: "number",
                            description: "Service price",
                            example: 2500.0,
                        },
                        currency: {
                            type: "string",
                            description: "Price currency",
                            example: "USD",
                        },
                        duration_minutes: {
                            type: "integer",
                            description: "Estimated duration in minutes",
                            example: 2400,
                        },
                        category: {
                            type: "string",
                            description: "Service category",
                            example: "development",
                        },
                    },
                },
                BusinessContextSection: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "Context section ID",
                            example: 1,
                        },
                        section_type: {
                            type: "string",
                            enum: [
                                "about",
                                "services",
                                "policies",
                                "procedures",
                                "custom",
                            ],
                            description: "Type of context section",
                            example: "about",
                        },
                        section_key: {
                            type: "string",
                            description: "Unique key for the section",
                            example: "company_overview",
                        },
                        section_name: {
                            type: "string",
                            description: "Display name for the section",
                            example: "Company Overview",
                        },
                        content: {
                            type: "string",
                            description: "Section content",
                            example:
                                "TechFlow Solutions is a leading technology company...",
                        },
                        display_order: {
                            type: "integer",
                            description: "Display order",
                            example: 1,
                        },
                        character_count: {
                            type: "integer",
                            description: "Number of characters in content",
                            example: 234,
                        },
                        word_count: {
                            type: "integer",
                            description: "Number of words in content",
                            example: 35,
                        },
                        last_accessed: {
                            type: "string",
                            format: "date-time",
                            description: "Last access timestamp",
                            example: "2024-01-15T09:20:00Z",
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
                Error: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            description: "Error message",
                            example: "Resource not found",
                        },
                        message: {
                            type: "string",
                            description: "Detailed error message",
                            example:
                                "The requested resource could not be found",
                        },
                        statusCode: {
                            type: "integer",
                            description: "HTTP status code",
                            example: 404,
                        },
                    },
                },
                Pagination: {
                    type: "object",
                    properties: {
                        page: {
                            type: "integer",
                            minimum: 1,
                            description: "Page number",
                            example: 1,
                        },
                        limit: {
                            type: "integer",
                            minimum: 1,
                            maximum: 100,
                            description: "Items per page",
                            example: 10,
                        },
                        total: {
                            type: "integer",
                            description: "Total number of items",
                            example: 100,
                        },
                        totalPages: {
                            type: "integer",
                            description: "Total number of pages",
                            example: 10,
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: "Business",
                description: "Business management endpoints",
            },
            {
                name: "Client",
                description: "Client management endpoints",
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
                name: "FAQ",
                description: "FAQ management endpoints",
            },
            {
                name: "Service",
                description: "Service management endpoints",
            },
            {
                name: "Platform",
                description: "Platform source management endpoints",
            },
            {
                name: "Webhook",
                description: "Webhook endpoints for external integrations",
            },
            {
                name: "Health",
                description: "Health check and system status endpoints",
            },
        ],
    },
    apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/app.js"],
    tags: [
        {
            name: "Authentication",
            description: "Firebase authentication endpoints",
        },
        {
            name: "Protected",
            description: "Protected endpoints requiring authentication",
        },
        {
            name: "Business",
            description: "Business management endpoints",
        },
        {
            name: "Webhooks",
            description: "Webhook endpoints for external integrations",
        },
        {
            name: "Business Public",
            description: "Public business endpoints for business pages",
        },
        {
            name: "Business Admin",
            description: "Admin endpoints for managing business content",
        },
        {
            name: "Business Settings",
            description: "Business settings management endpoints",
        },
    ],
};

const specs = swaggerJSDoc(options);

module.exports = specs;
