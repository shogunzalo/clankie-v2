// Test setup file
require("dotenv").config({ path: ".env.test" });

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Set test environment - use in-memory SQLite
process.env.NODE_ENV = "test";
process.env.DB_NAME = "clankie_test_db";

// Mock database connection for tests
const { Sequelize } = require("sequelize");

// Create in-memory SQLite connection for tests
global.testSequelize = new Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

// Mock OpenAI to avoid API calls in tests
jest.mock("openai", () => {
    return {
        OpenAI: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify({
                                        intent: "test_intent",
                                        sentiment: 0.5,
                                        urgency: 0.3,
                                        buying_signals: ["test_signal"],
                                        objections: [],
                                        questions: ["test_question"],
                                        next_best_action: "test_action",
                                        confidence: 0.8,
                                        key_phrases: ["test_phrase"],
                                        lead_score: 75,
                                        is_continuation: false,
                                        image_analysis: "No images",
                                    }),
                                },
                            },
                        ],
                    }),
                },
            },
        })),
    };
});

// Set test environment variables
process.env.OPENAI_API_KEY = "test-key";

// Mock axios for webhook calls
jest.mock("axios", () => ({
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
}));
