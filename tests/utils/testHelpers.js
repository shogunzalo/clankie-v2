// Test helper utilities

/**
 * Create a mock request object for testing
 */
const createMockRequest = (overrides = {}) => {
    return {
        query: {},
        body: {},
        params: {},
        headers: {},
        ...overrides,
    };
};

/**
 * Create a mock response object for testing
 */
const createMockResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        sendStatus: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        redirect: jest.fn(),
    };
    return res;
};

/**
 * Create mock message data for AI processing tests
 */
const createMockMessageData = (overrides = {}) => {
    return {
        conversationId: 1,
        userId: "test_user_123",
        message: "Hello! I'm interested in your services.",
        clientId: 1,
        businessId: 1,
        platformSourceId: 1,
        attachments: null,
        ...overrides,
    };
};

/**
 * Create mock conversation context
 */
const createMockContext = (overrides = {}) => {
    return {
        currentState: "initial_contact",
        businessType: "Technology",
        businessName: "Test Company",
        businessDescription: "A test company",
        conversationHistory: [],
        leadScore: 0,
        sentimentScore: 0,
        ...overrides,
    };
};

/**
 * Create mock conversation object
 */
const createMockConversation = (overrides = {}) => {
    return {
        id: 1,
        status: "active",
        lead_score: 50,
        sentiment_score: 0.3,
        message_count: 0,
        started_at: new Date(),
        last_message_at: new Date(),
        client: {
            id: 1,
            platform_user_id: "test_user_123",
            first_contact: new Date(),
            last_contact: new Date(),
            engagement_score: 0.7,
        },
        platform_source: {
            id: 1,
            platform_type: "instagram",
            platform_name: "Test Instagram",
        },
        update: jest.fn(),
        ...overrides,
    };
};

/**
 * Create mock client object
 */
const createMockClient = (overrides = {}) => {
    return {
        id: 1,
        platform_user_id: "test_user_123",
        business_id: 1,
        first_contact: new Date(),
        last_contact: new Date(),
        engagement_score: 0.5,
        update: jest.fn(),
        ...overrides,
    };
};

/**
 * Create mock platform source object
 */
const createMockPlatformSource = (overrides = {}) => {
    return {
        id: 1,
        business_id: 1,
        platform_type: "instagram",
        platform_name: "Test Instagram",
        is_active: true,
        last_sync: new Date(),
        update: jest.fn(),
        ...overrides,
    };
};

/**
 * Create mock business object
 */
const createMockBusiness = (overrides = {}) => {
    return {
        id: 1,
        name: "Test Business",
        description: "A test business",
        industry: "Technology",
        ...overrides,
    };
};

/**
 * Create mock message object
 */
const createMockMessage = (overrides = {}) => {
    return {
        id: 1,
        conversation_id: 1,
        sender_type: "client",
        content: "Hello!",
        message_type: "text",
        platform_message_id: "msg_123",
        sent_at: new Date(),
        is_read: false,
        ...overrides,
    };
};

/**
 * Create mock AI analysis result
 */
const createMockAnalysis = (overrides = {}) => {
    return {
        intent: "showing_interest",
        sentiment: 0.6,
        urgency: 0.3,
        buying_signals: ["interested"],
        objections: [],
        questions: ["tell me more"],
        next_best_action: "engage_and_qualify",
        confidence: 0.8,
        key_phrases: ["interested", "services"],
        lead_score: 60,
        is_continuation: false,
        timestamp: new Date().toISOString(),
        raw_message: "Hello! I'm interested in your services.",
        has_images: false,
        ...overrides,
    };
};

/**
 * Create mock AI processing result
 */
const createMockAIResult = (overrides = {}) => {
    return {
        success: true,
        analysis: createMockAnalysis(),
        newState: "engaged",
        response:
            "Thanks for your interest! What specific challenges are you looking to solve?",
        responseTime: 150,
        ...overrides,
    };
};

/**
 * Wait for a specified amount of time (useful for testing async operations)
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Create a mock webhook payload
 */
const createMockWebhookPayload = (overrides = {}) => {
    return {
        object: "instagram",
        entry: [
            {
                messaging: [
                    {
                        sender: { id: "test_user_123" },
                        message: { text: "Hello!" },
                    },
                ],
            },
        ],
        ...overrides,
    };
};

/**
 * Create a mock Instagram postback payload
 */
const createMockPostbackPayload = (payload = "yes") => {
    return {
        object: "instagram",
        entry: [
            {
                messaging: [
                    {
                        sender: { id: "test_user_123" },
                        postback: { payload },
                    },
                ],
            },
        ],
    };
};

/**
 * Mock console methods to reduce noise in tests
 */
const mockConsole = () => {
    const originalConsole = { ...console };

    beforeEach(() => {
        console.log = jest.fn();
        console.debug = jest.fn();
        console.info = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        Object.assign(console, originalConsole);
    });
};

/**
 * Setup test environment variables
 */
const setupTestEnv = () => {
    process.env.NODE_ENV = "test";
    process.env.DB_NAME = "clankie_test_db";
    process.env.JWT_SECRET = "test_jwt_secret";
    process.env.VERIFY_TOKEN = "test_verify_token";
    process.env.INSTAGRAM_TEST_TOKEN = "test_instagram_token";
};

module.exports = {
    createMockRequest,
    createMockResponse,
    createMockMessageData,
    createMockContext,
    createMockConversation,
    createMockClient,
    createMockPlatformSource,
    createMockBusiness,
    createMockMessage,
    createMockAnalysis,
    createMockAIResult,
    createMockWebhookPayload,
    createMockPostbackPayload,
    wait,
    mockConsole,
    setupTestEnv,
};
