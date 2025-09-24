const AIMessageProcessor = require("../../src/services/AIMessageProcessor");
const {
    Conversation,
    Message,
    Client,
    PlatformSource,
    Business,
} = require("../../src/models");

// Mock the models
jest.mock("../../src/models", () => ({
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
}));

describe("AIMessageProcessor", () => {
    let aiProcessor;
    let mockOpenAI;

    beforeEach(() => {
        aiProcessor = new AIMessageProcessor();
        mockOpenAI = aiProcessor.openai;
        jest.clearAllMocks();
    });

    describe("Constructor", () => {
        it("should initialize with OpenAI if API key is available", () => {
            process.env.OPENAI_API_KEY = "test-key";
            const processor = new AIMessageProcessor();
            expect(processor.openai).toBeDefined();
        });

        it("should initialize without OpenAI if API key is not available", () => {
            delete process.env.OPENAI_API_KEY;
            const processor = new AIMessageProcessor();
            expect(processor.openai).toBeNull();
        });
    });

    describe("processMessage", () => {
        const mockMessageData = {
            conversationId: 1,
            userId: "test_user_123",
            message: "Hello! I'm interested in your services.",
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

        beforeEach(() => {
            // Mock the internal methods
            jest.spyOn(aiProcessor, "getConversationContext").mockResolvedValue(
                mockContext
            );
            jest.spyOn(aiProcessor, "analyzeMessageWithAI").mockResolvedValue({
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
                raw_message: mockMessageData.message,
                has_images: false,
            });
            jest.spyOn(
                aiProcessor,
                "determineStateTransition"
            ).mockResolvedValue("engaged");
            jest.spyOn(aiProcessor, "generateResponse").mockResolvedValue(
                "Thanks for your interest! What specific challenges are you looking to solve?"
            );
        });

        it("should process message successfully", async () => {
            const result = await aiProcessor.processMessage(mockMessageData);

            expect(result.success).toBe(true);
            expect(result.analysis).toBeDefined();
            expect(result.newState).toBe("engaged");
            expect(result.response).toBe(
                "Thanks for your interest! What specific challenges are you looking to solve?"
            );
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });

        it("should handle errors gracefully", async () => {
            jest.spyOn(aiProcessor, "getConversationContext").mockRejectedValue(
                new Error("Database error")
            );

            const result = await aiProcessor.processMessage(mockMessageData);

            expect(result.success).toBe(false);
            expect(result.error).toBe("Database error");
            expect(result.response).toBeDefined();
        });

        it("should measure response time", async () => {
            const result = await aiProcessor.processMessage(mockMessageData);
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });
    });

    describe("getConversationContext", () => {
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
                content: "Hello",
                sent_at: new Date(),
            },
            {
                id: 2,
                sender_type: "business",
                content: "Hi there!",
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

        it("should get conversation context by ID", async () => {
            const context = await aiProcessor.getConversationContext(
                "test_user",
                1,
                1,
                1
            );

            expect(Conversation.findByPk).toHaveBeenCalledWith(
                1,
                expect.any(Object)
            );
            expect(context.currentState).toBe("active");
            expect(context.businessType).toBe("Technology");
            expect(context.businessName).toBe("Test Company");
            expect(context.conversationHistory).toHaveLength(2);
        });

        it("should fallback to findOne if findByPk returns null", async () => {
            Conversation.findByPk.mockResolvedValue(null);
            Conversation.findOne.mockResolvedValue(mockConversation);

            const context = await aiProcessor.getConversationContext(
                "test_user",
                1,
                null,
                1
            );

            expect(Conversation.findOne).toHaveBeenCalled();
            expect(context.currentState).toBe("active");
        });

        it("should return default context if no conversation found", async () => {
            Conversation.findByPk.mockResolvedValue(null);
            Conversation.findOne.mockResolvedValue(null);

            const context = await aiProcessor.getConversationContext(
                "test_user",
                1,
                null,
                1
            );

            expect(context.currentState).toBe("initial_contact");
            expect(context.businessType).toBe("General Business");
            expect(context.conversationHistory).toEqual([]);
        });

        it("should handle errors gracefully", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database error")
            );

            const context = await aiProcessor.getConversationContext(
                "test_user",
                1,
                null,
                1
            );

            expect(context.currentState).toBe("initial_contact");
            expect(context.businessType).toBe("General Business");
        });
    });

    describe("analyzeMessageWithAI", () => {
        const mockContext = {
            currentState: "initial_contact",
            businessType: "Technology",
            businessName: "Test Company",
            conversationHistory: [],
        };

        beforeEach(() => {
            process.env.OPENAI_API_KEY = "test-key";
            aiProcessor = new AIMessageProcessor();
        });

        it("should analyze message with OpenAI", async () => {
            const analysis = await aiProcessor.analyzeMessageWithAI(
                "Hello!",
                mockContext,
                null
            );

            expect(analysis.intent).toBe("test_intent");
            expect(analysis.sentiment).toBe(0.5);
            expect(analysis.lead_score).toBe(75);
            expect(analysis.timestamp).toBeDefined();
            expect(analysis.raw_message).toBe("Hello!");
            expect(analysis.has_images).toBe(false);
        });

        it("should handle image attachments", async () => {
            const attachments = [
                {
                    type: "image",
                    payload: { url: "https://example.com/image.jpg" },
                },
            ];

            const analysis = await aiProcessor.analyzeMessageWithAI(
                "Check this out!",
                mockContext,
                attachments
            );

            expect(analysis.has_images).toBe(true);
            expect(analysis.intent).toBe("test_intent");
        });

        it("should use fallback analysis when OpenAI is not available", async () => {
            delete process.env.OPENAI_API_KEY;
            aiProcessor = new AIMessageProcessor();

            const analysis = await aiProcessor.analyzeMessageWithAI(
                "Hello!",
                mockContext,
                null
            );

            expect(analysis.intent).toBe("greeting");
            expect(analysis.sentiment).toBe(0.5);
            expect(analysis.lead_score).toBe(45);
        });

        it("should handle OpenAI API errors", async () => {
            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create.mockRejectedValue(
                    new Error("API Error")
                );
            }

            const analysis = await aiProcessor.analyzeMessageWithAI(
                "Hello!",
                mockContext,
                null
            );

            expect(analysis.intent).toBe("greeting");
            expect(analysis.sentiment).toBe(0.5);
        });
    });

    describe("determineStateTransition", () => {
        const mockAnalysis = {
            intent: "showing_interest",
            sentiment: 0.6,
            urgency: 0.3,
            lead_score: 60,
        };

        const mockHistory = [
            { senderType: "client", messageText: "Hello" },
            { senderType: "business", messageText: "Hi there!" },
        ];

        beforeEach(() => {
            process.env.OPENAI_API_KEY = "test-key";
            aiProcessor = new AIMessageProcessor();
        });

        it("should determine state transition with OpenAI", async () => {
            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create.mockResolvedValue({
                    choices: [
                        {
                            message: {
                                content: JSON.stringify({
                                    new_state: "interested",
                                    reason: "Customer showing interest",
                                    confidence: 0.8,
                                }),
                            },
                        },
                    ],
                });
            }

            const newState = await aiProcessor.determineStateTransition(
                "initial_contact",
                mockAnalysis,
                mockHistory
            );

            expect(newState).toBe("interested");
        });

        it("should use rule-based fallback when OpenAI fails", async () => {
            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create.mockRejectedValue(
                    new Error("API Error")
                );
            }

            const newState = await aiProcessor.determineStateTransition(
                "initial_contact",
                mockAnalysis,
                mockHistory
            );

            expect(newState).toBe("interested");
        });

        it("should use rule-based fallback when OpenAI is not available", async () => {
            delete process.env.OPENAI_API_KEY;
            aiProcessor = new AIMessageProcessor();

            const newState = await aiProcessor.determineStateTransition(
                "initial_contact",
                mockAnalysis,
                mockHistory
            );

            expect(newState).toBe("interested");
        });
    });

    describe("generateResponse", () => {
        const mockAnalysis = {
            intent: "showing_interest",
            sentiment: 0.6,
            lead_score: 60,
        };

        const mockContext = {
            businessType: "Technology",
            businessName: "Test Company",
            conversationHistory: [],
        };

        beforeEach(() => {
            process.env.OPENAI_API_KEY = "test-key";
            aiProcessor = new AIMessageProcessor();
        });

        it("should generate response with OpenAI", async () => {
            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create.mockResolvedValue({
                    choices: [
                        {
                            message: {
                                content:
                                    "Thanks for your interest! What specific challenges are you looking to solve?",
                            },
                        },
                    ],
                });
            }

            const response = await aiProcessor.generateResponse(
                mockAnalysis,
                "engaged",
                mockContext
            );

            expect(response).toBe(
                "Thanks for your interest! What specific challenges are you looking to solve?"
            );
        });

        it("should use fallback response when OpenAI fails", async () => {
            if (aiProcessor.openai) {
                aiProcessor.openai.chat.completions.create.mockRejectedValue(
                    new Error("API Error")
                );
            }

            const response = await aiProcessor.generateResponse(
                mockAnalysis,
                "engaged",
                mockContext
            );

            expect(response).toBe(
                "Thanks for your interest! What specific challenges are you looking to solve?"
            );
        });

        it("should use fallback response when OpenAI is not available", async () => {
            delete process.env.OPENAI_API_KEY;
            aiProcessor = new AIMessageProcessor();

            const response = await aiProcessor.generateResponse(
                mockAnalysis,
                "engaged",
                mockContext
            );

            expect(response).toBe(
                "Thanks for your interest! What specific challenges are you looking to solve?"
            );
        });
    });

    describe("fallbackAnalysis", () => {
        it("should analyze greeting messages", () => {
            const analysis = aiProcessor.fallbackAnalysis("Hello!");

            expect(analysis.intent).toBe("greeting");
            expect(analysis.sentiment).toBe(0.5);
            expect(analysis.lead_score).toBe(45);
        });

        it("should analyze interest messages", () => {
            const analysis = aiProcessor.fallbackAnalysis(
                "I'm interested in your services"
            );

            expect(analysis.intent).toBe("showing_interest");
            expect(analysis.sentiment).toBe(0.6);
            expect(analysis.lead_score).toBe(60);
        });

        it("should analyze buying signals", () => {
            const analysis = aiProcessor.fallbackAnalysis(
                "I want to purchase this product"
            );

            expect(analysis.intent).toBe("ready_to_buy");
            expect(analysis.sentiment).toBe(0.8);
            expect(analysis.lead_score).toBe(85);
        });

        it("should analyze price concerns", () => {
            const analysis = aiProcessor.fallbackAnalysis(
                "This costs too much"
            );

            expect(analysis.intent).toBe("price_concern");
            expect(analysis.sentiment).toBe(-0.2);
            expect(analysis.lead_score).toBe(40);
        });

        it("should analyze questions", () => {
            const analysis = aiProcessor.fallbackAnalysis(
                "What is your pricing?"
            );

            expect(analysis.intent).toBe("question");
            expect(analysis.sentiment).toBe(0.3);
            expect(analysis.lead_score).toBe(55);
        });

        it("should handle empty messages", () => {
            const analysis = aiProcessor.fallbackAnalysis("");

            expect(analysis.intent).toBe("initial_inquiry");
            expect(analysis.sentiment).toBe(0);
            expect(analysis.lead_score).toBe(30);
        });
    });

    describe("ruleBasedStateTransition", () => {
        it("should transition to lost for negative sentiment", () => {
            const analysis = { sentiment: -0.6, intent: "complaint" };
            const newState = aiProcessor.ruleBasedStateTransition(
                "engaged",
                analysis
            );
            expect(newState).toBe("lost");
        });

        it("should transition to ready_to_convert for buying intent", () => {
            const analysis = { intent: "ready_to_buy", sentiment: 0.8 };
            const newState = aiProcessor.ruleBasedStateTransition(
                "interested",
                analysis
            );
            expect(newState).toBe("ready_to_convert");
        });

        it("should transition to interested for showing interest", () => {
            const analysis = { intent: "showing_interest", sentiment: 0.6 };
            const newState = aiProcessor.ruleBasedStateTransition(
                "engaged",
                analysis
            );
            expect(newState).toBe("interested");
        });

        it("should transition to objection for price concerns", () => {
            const analysis = { intent: "price_concern", sentiment: -0.2 };
            const newState = aiProcessor.ruleBasedStateTransition(
                "interested",
                analysis
            );
            expect(newState).toBe("objection");
        });

        it("should transition to qualified for high urgency", () => {
            const analysis = { urgency: 0.8, intent: "question" };
            const newState = aiProcessor.ruleBasedStateTransition(
                "interested",
                analysis
            );
            expect(newState).toBe("qualified");
        });

        it("should transition to engaged from initial_contact", () => {
            const analysis = { intent: "question", sentiment: 0.3 };
            const newState = aiProcessor.ruleBasedStateTransition(
                "initial_contact",
                analysis
            );
            expect(newState).toBe("interested");
        });

        it("should maintain current state if no transition rules match", () => {
            const analysis = {
                intent: "greeting",
                sentiment: 0.5,
                urgency: 0.2,
            };
            const newState = aiProcessor.ruleBasedStateTransition(
                "engaged",
                analysis
            );
            expect(newState).toBe("engaged");
        });
    });

    describe("fallbackResponse", () => {
        it("should return appropriate response for initial_contact", () => {
            const response = aiProcessor.fallbackResponse("initial_contact");
            expect(response).toBe(
                "Thanks for reaching out! How can I help you today?"
            );
        });

        it("should return appropriate response for engaged", () => {
            const response = aiProcessor.fallbackResponse("engaged");
            expect(response).toBe(
                "Thanks for your interest! What specific challenges are you looking to solve?"
            );
        });

        it("should return appropriate response for interested", () => {
            const response = aiProcessor.fallbackResponse("interested");
            expect(response).toBe(
                "Great! I'd love to learn more about your needs. What's your timeline for implementing a solution?"
            );
        });

        it("should return appropriate response for qualified", () => {
            const response = aiProcessor.fallbackResponse("qualified");
            expect(response).toBe(
                "Perfect! Based on what you've shared, I think we can definitely help. Would you like to schedule a quick 15-minute call to discuss your specific situation?"
            );
        });

        it("should return appropriate response for ready_to_convert", () => {
            const response = aiProcessor.fallbackResponse("ready_to_convert");
            expect(response).toBe(
                "Excellent! Let me send you a link to book a convenient time for a demo. What days work best for you?"
            );
        });

        it("should return appropriate response for objection", () => {
            const response = aiProcessor.fallbackResponse("objection");
            expect(response).toBe(
                "I understand your concerns. Many of our clients had similar questions initially. Can I address any specific concerns you have?"
            );
        });

        it("should return appropriate response for lost", () => {
            const response = aiProcessor.fallbackResponse("lost");
            expect(response).toBe(
                "I understand. If anything changes or you have questions in the future, feel free to reach out!"
            );
        });

        it("should return default response for unknown state", () => {
            const response = aiProcessor.fallbackResponse("unknown_state");
            expect(response).toBe(
                "Thanks for your interest! What specific challenges are you looking to solve?"
            );
        });
    });
});
