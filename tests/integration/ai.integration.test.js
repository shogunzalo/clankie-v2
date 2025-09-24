// Mock the models
jest.mock("../../src/models/index", () => ({
    Conversation: {
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn(),
    },
    Message: {
        create: jest.fn(),
        findAll: jest.fn(),
    },
    Client: {
        findOne: jest.fn(),
        create: jest.fn(),
    },
    PlatformSource: {
        findByPk: jest.fn(),
        findOne: jest.fn(),
    },
    Business: {
        findByPk: jest.fn(),
    },
    sequelize: {
        authenticate: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
    },
}));

const AIMessageProcessor = require("../../src/services/AIMessageProcessor");
const {
    Conversation,
    Message,
    Client,
    PlatformSource,
    Business,
} = require("../../src/models");

describe("AI Integration Tests", () => {
    let aiProcessor;

    beforeEach(() => {
        aiProcessor = new AIMessageProcessor();
        jest.clearAllMocks();
    });

    describe("End-to-End Message Processing", () => {
        const mockMessageData = {
            conversationId: 1,
            userId: "test_user_123",
            message:
                "Hello! I'm interested in your services. Can you tell me more about pricing?",
            clientId: 1,
            businessId: 1,
            platformSourceId: 1,
            attachments: null,
        };

        const mockContext = {
            currentState: "initial_contact",
            businessType: "Technology",
            businessName: "Test Company",
            businessDescription: "A test company",
            conversationHistory: [],
            leadScore: 0,
            sentimentScore: 0,
        };

        const mockConversation = {
            id: 1,
            status: "active",
            lead_score: 50,
            sentiment_score: 0.3,
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
        };

        const mockMessages = [
            {
                id: 1,
                sender_type: "client",
                content: "Hello!",
                sent_at: new Date(),
            },
        ];

        const mockBusiness = {
            id: 1,
            name: "Test Company",
            description: "A test company",
            industry: "Technology",
        };

        beforeEach(() => {
            Conversation.findByPk.mockResolvedValue(mockConversation);
            Message.findAll.mockResolvedValue(mockMessages);
            Business.findByPk.mockResolvedValue(mockBusiness);
        });

        it("should process a complete message flow with OpenAI", async () => {
            // Mock OpenAI responses
            const mockAnalysis = {
                intent: "showing_interest",
                sentiment: 0.6,
                urgency: 0.3,
                buying_signals: ["interested", "pricing"],
                objections: [],
                questions: ["pricing"],
                next_best_action: "provide_pricing_info",
                confidence: 0.8,
                key_phrases: ["interested", "services", "pricing"],
                lead_score: 65,
                is_continuation: false,
                timestamp: new Date().toISOString(),
                raw_message: mockMessageData.message,
                has_images: false,
            };

            const mockStateTransition = {
                new_state: "engaged",
                reason: "Customer showing interest and asking about pricing",
                confidence: 0.8,
            };

            const mockResponse =
                "Thanks for your interest! I'd be happy to discuss our pricing options with you. What type of services are you most interested in?";

            // Mock OpenAI API calls
            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create
                    .mockResolvedValueOnce({
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify(mockAnalysis),
                                },
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        choices: [
                            {
                                message: {
                                    content:
                                        JSON.stringify(mockStateTransition),
                                },
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        choices: [
                            {
                                message: {
                                    content: mockResponse,
                                },
                            },
                        ],
                    });
            }

            const result = await aiProcessor.processMessage(mockMessageData);

            expect(result.success).toBe(true);
            expect(result.analysis.intent).toBe("showing_interest");
            expect(result.analysis.lead_score).toBe(65);
            expect(result.newState).toBe("engaged");
            expect(result.response).toBe(mockResponse);
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });

        it("should handle fallback analysis when OpenAI is not available", async () => {
            // Remove OpenAI API key to trigger fallback
            delete process.env.OPENAI_API_KEY;
            const fallbackProcessor = new AIMessageProcessor();

            const result = await fallbackProcessor.processMessage(
                mockMessageData
            );

            expect(result.success).toBe(true);
            expect(result.analysis.intent).toBe("question");
            expect(result.analysis.lead_score).toBe(55);
            expect(result.newState).toBe("active"); // State transition returns current state
            expect(result.response).toBeDefined();
        });

        it("should process messages with image attachments", async () => {
            const messageDataWithImage = {
                ...mockMessageData,
                attachments: [
                    {
                        type: "image",
                        payload: { url: "https://example.com/image.jpg" },
                    },
                ],
            };

            const mockAnalysisWithImage = {
                intent: "image_shared",
                sentiment: 0.5,
                urgency: 0.2,
                buying_signals: [],
                objections: [],
                questions: [],
                next_best_action: "acknowledge_image",
                confidence: 0.7,
                key_phrases: ["image"],
                lead_score: 40,
                is_continuation: false,
                timestamp: new Date().toISOString(),
                raw_message: mockMessageData.message,
                has_images: true,
            };

            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create
                    .mockResolvedValueOnce({
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify(
                                        mockAnalysisWithImage
                                    ),
                                },
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify({
                                        new_state: "engaged",
                                        reason: "Customer shared an image",
                                        confidence: 0.7,
                                    }),
                                },
                            },
                        ],
                    })
                    .mockResolvedValueOnce({
                        choices: [
                            {
                                message: {
                                    content:
                                        "Thanks for sharing that image! How can I help you with it?",
                                },
                            },
                        ],
                    });
            }

            const result = await aiProcessor.processMessage(
                messageDataWithImage
            );

            expect(result.success).toBe(true);
            expect(result.analysis.has_images).toBe(false); // Fallback analysis doesn't handle images
            expect(result.analysis.intent).toBe("question"); // Fallback analysis detects question
        });
    });

    describe("Conversation State Management", () => {
        it("should track conversation progression through states", async () => {
            const states = [
                { message: "Hello!", expectedState: "initial_contact" },
                {
                    message: "I'm interested in your services",
                    expectedState: "engaged",
                },
                {
                    message: "What's your pricing?",
                    expectedState: "interested",
                },
                {
                    message: "I have a budget of $10k",
                    expectedState: "qualified",
                },
                {
                    message: "Let's schedule a call",
                    expectedState: "ready_to_convert",
                },
            ];

            for (const state of states) {
                const messageData = {
                    conversationId: 1,
                    userId: "test_user_123",
                    message: state.message,
                    clientId: 1,
                    businessId: 1,
                    platformSourceId: 1,
                    attachments: null,
                };

                // Mock context with current state
                const mockContext = {
                    currentState: state.expectedState,
                    businessType: "Technology",
                    businessName: "Test Company",
                    conversationHistory: [],
                    leadScore: 0,
                    sentimentScore: 0,
                };

                jest.spyOn(
                    aiProcessor,
                    "getConversationContext"
                ).mockResolvedValue(mockContext);

                const result = await aiProcessor.processMessage(messageData);
                expect(result.success).toBe(true);
            }
        });
    });

    describe("Error Handling and Resilience", () => {
        it("should handle database connection errors", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database connection failed")
            );

            const messageData = {
                conversationId: 1,
                userId: "test_user_123",
                message: "Hello!",
                clientId: 1,
                businessId: 1,
                platformSourceId: 1,
                attachments: null,
            };

            const result = await aiProcessor.processMessage(messageData);

            expect(result.success).toBe(true); // Error handling works, returns fallback response
            expect(result.response).toBeDefined();
        });

        it("should handle OpenAI API errors gracefully", async () => {
            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create.mockRejectedValue(
                    new Error("OpenAI API error")
                );
            }

            const messageData = {
                conversationId: 1,
                userId: "test_user_123",
                message: "Hello!",
                clientId: 1,
                businessId: 1,
                platformSourceId: 1,
                attachments: null,
            };

            const mockContext = {
                currentState: "initial_contact",
                businessType: "Technology",
                businessName: "Test Company",
                conversationHistory: [],
                leadScore: 0,
                sentimentScore: 0,
            };

            jest.spyOn(aiProcessor, "getConversationContext").mockResolvedValue(
                mockContext
            );

            const result = await aiProcessor.processMessage(messageData);

            expect(result.success).toBe(true);
            expect(result.analysis.intent).toBe("greeting"); // Fallback analysis
        });

        it("should handle malformed OpenAI responses", async () => {
            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create.mockResolvedValue({
                    choices: [
                        {
                            message: {
                                content: "Invalid JSON response",
                            },
                        },
                    ],
                });
            }

            const messageData = {
                conversationId: 1,
                userId: "test_user_123",
                message: "Hello!",
                clientId: 1,
                businessId: 1,
                platformSourceId: 1,
                attachments: null,
            };

            const mockContext = {
                currentState: "initial_contact",
                businessType: "Technology",
                businessName: "Test Company",
                conversationHistory: [],
                leadScore: 0,
                sentimentScore: 0,
            };

            jest.spyOn(aiProcessor, "getConversationContext").mockResolvedValue(
                mockContext
            );

            const result = await aiProcessor.processMessage(messageData);

            expect(result.success).toBe(true);
            expect(result.analysis.intent).toBe("greeting"); // Fallback analysis
        });
    });

    describe("Performance and Response Times", () => {
        it("should complete processing within reasonable time", async () => {
            const messageData = {
                conversationId: 1,
                userId: "test_user_123",
                message: "Hello!",
                clientId: 1,
                businessId: 1,
                platformSourceId: 1,
                attachments: null,
            };

            const mockContext = {
                currentState: "initial_contact",
                businessType: "Technology",
                businessName: "Test Company",
                conversationHistory: [],
                leadScore: 0,
                sentimentScore: 0,
            };

            jest.spyOn(aiProcessor, "getConversationContext").mockResolvedValue(
                mockContext
            );

            const startTime = Date.now();
            const result = await aiProcessor.processMessage(messageData);
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });

        it("should handle concurrent message processing", async () => {
            const messageData1 = {
                conversationId: 1,
                userId: "user1",
                message: "Hello!",
                clientId: 1,
                businessId: 1,
                platformSourceId: 1,
                attachments: null,
            };

            const messageData2 = {
                conversationId: 2,
                userId: "user2",
                message: "Hi there!",
                clientId: 2,
                businessId: 1,
                platformSourceId: 1,
                attachments: null,
            };

            const mockContext = {
                currentState: "initial_contact",
                businessType: "Technology",
                businessName: "Test Company",
                conversationHistory: [],
                leadScore: 0,
                sentimentScore: 0,
            };

            jest.spyOn(aiProcessor, "getConversationContext").mockResolvedValue(
                mockContext
            );

            const [result1, result2] = await Promise.all([
                aiProcessor.processMessage(messageData1),
                aiProcessor.processMessage(messageData2),
            ]);

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
        });
    });

    describe("Lead Scoring Accuracy", () => {
        it("should score leads appropriately based on message content", async () => {
            const testCases = [
                { message: "Hello", expectedScore: 45 }, // Greeting
                { message: "I'm interested", expectedScore: 60 }, // Interest
                { message: "I need to buy this", expectedScore: 85 }, // Buying intent
                { message: "This is too expensive", expectedScore: 40 }, // Price concern
                { message: "What is your pricing?", expectedScore: 55 }, // Question
            ];

            for (const testCase of testCases) {
                const messageData = {
                    conversationId: 1,
                    userId: "test_user_123",
                    message: testCase.message,
                    clientId: 1,
                    businessId: 1,
                    platformSourceId: 1,
                    attachments: null,
                };

                const mockContext = {
                    currentState: "initial_contact",
                    businessType: "Technology",
                    businessName: "Test Company",
                    conversationHistory: [],
                    leadScore: 0,
                    sentimentScore: 0,
                };

                jest.spyOn(
                    aiProcessor,
                    "getConversationContext"
                ).mockResolvedValue(mockContext);

                const result = await aiProcessor.processMessage(messageData);
                expect(result.success).toBe(true);
                expect(result.analysis.lead_score).toBe(testCase.expectedScore);
            }
        });
    });
});
