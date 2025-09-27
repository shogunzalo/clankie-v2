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
    ],
};

const specs = swaggerJSDoc(options);

module.exports = specs;
