"use strict";

const AIResponseService = require("../../services/aiResponseService");

// Mock OpenAI
jest.mock("openai", () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn(),
            },
        },
    }));
});

describe("AIResponseService", () => {
    let aiResponseService;
    let mockOpenAI;

    beforeEach(() => {
        aiResponseService = new AIResponseService();
        mockOpenAI = require("openai");

        // Set up environment variable for testing
        process.env.OPENAI_API_KEY = "test-api-key";
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("generateResponse", () => {
        it("should generate a response with valid context sources", async () => {
            const params = {
                question: "What services do you offer?",
                contextSources: [
                    {
                        id: 1,
                        type: "template",
                        section_name: "Services",
                        content:
                            "We offer web development, mobile apps, and consulting services.",
                        similarity_score: 0.9,
                    },
                ],
                confidenceScore: 0.9,
                isConfident: true,
                businessInfo: { id: 1, name: "Test Business" },
                language: "en",
            };

            const result = await aiResponseService.generateResponse(params);

            expect(result).toHaveProperty("response");
            expect(result).toHaveProperty("response_time");
            expect(result).toHaveProperty("confidence_score");
            expect(result).toHaveProperty("is_confident");
            expect(result).toHaveProperty("context_sources_used");
            expect(result).toHaveProperty("metadata");
            expect(typeof result.response_time).toBe("number");
            expect(result.confidence_score).toBe(0.9);
            expect(result.is_confident).toBe(true);
        });

        it("should handle empty context sources", async () => {
            const params = {
                question: "What services do you offer?",
                contextSources: [],
                confidenceScore: 0.1,
                isConfident: false,
                businessInfo: { id: 1, name: "Test Business" },
                language: "en",
            };

            const result = await aiResponseService.generateResponse(params);

            expect(result).toHaveProperty("response");
            expect(result).toHaveProperty("confidence_score");
            expect(result).toHaveProperty("is_confident");
            expect(result.is_confident).toBe(false);
            expect(result.confidence_score).toBe(0.1);
        });

        it("should handle missing parameters gracefully", async () => {
            const params = {
                question: "What services do you offer?",
                // Missing other required parameters
            };

            const result = await aiResponseService.generateResponse(params);

            expect(result).toHaveProperty("response");
            expect(result).toHaveProperty("confidence_score");
            expect(result).toHaveProperty("is_confident");
            expect(result).toHaveProperty("response_time");
        });
    });

    describe("buildContext", () => {
        it("should build context from sources", () => {
            const contextSources = [
                {
                    id: 1,
                    type: "template",
                    section_name: "Services",
                    content: "We offer web development services.",
                    similarity_score: 0.9,
                },
                {
                    id: 2,
                    type: "context",
                    section_name: "About Us",
                    content: "We are a tech company founded in 2020.",
                    similarity_score: 0.7,
                },
            ];

            const businessInfo = { id: 1, name: "Test Business" };

            const context = aiResponseService.buildContext(
                contextSources,
                businessInfo
            );

            expect(context).toContain("Services");
            expect(context).toContain("web development services");
            expect(context).toContain("About Us");
            expect(context).toContain("tech company");
        });

        it("should handle empty context sources", () => {
            const context = aiResponseService.buildContext([], {});

            expect(context).toBeDefined();
            expect(typeof context).toBe("string");
        });
    });

    describe("LLM Integration", () => {
        beforeEach(() => {
            // Mock OpenAI instance
            const mockCreate = jest.fn();
            mockOpenAI.mockImplementation(() => ({
                chat: {
                    completions: {
                        create: mockCreate,
                    },
                },
            }));
        });

        it("should call OpenAI for confident responses", async () => {
            const mockCreate = jest.fn().mockResolvedValue({
                choices: [
                    {
                        message: {
                            content:
                                "We offer comprehensive web development services including frontend and backend development.",
                        },
                    },
                ],
            });

            mockOpenAI.mockImplementation(() => ({
                chat: {
                    completions: {
                        create: mockCreate,
                    },
                },
            }));

            const params = {
                question: "What services do you offer?",
                contextSources: [
                    {
                        id: 1,
                        type: "template",
                        section_name: "Services",
                        content: "We offer web development services.",
                        similarity_score: 0.9,
                    },
                ],
                confidenceScore: 0.9,
                isConfident: true,
                businessInfo: { id: 1, name: "Test Business" },
                language: "en",
            };

            const result = await aiResponseService.generateResponse(params);

            expect(result.response).toBe(
                "We offer comprehensive web development services including frontend and backend development."
            );
            expect(result.metadata.method).toBe("openai_confident");
            expect(mockCreate).toHaveBeenCalledWith({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: expect.any(String) },
                    {
                        role: "user",
                        content: expect.stringContaining(
                            "What services do you offer?"
                        ),
                    },
                ],
                temperature: 0.7,
                max_tokens: 300,
            });
        });

        it("should call OpenAI for greeting responses", async () => {
            const mockCreate = jest.fn().mockResolvedValue({
                choices: [
                    {
                        message: {
                            content:
                                "Hello! I'm here to help you with any questions you might have about our services.",
                        },
                    },
                ],
            });

            mockOpenAI.mockImplementation(() => ({
                chat: {
                    completions: {
                        create: mockCreate,
                    },
                },
            }));

            const params = {
                question: "Hello there",
                contextSources: [],
                confidenceScore: 0.2,
                isConfident: false,
                businessInfo: { id: 1, name: "Test Business" },
                language: "en",
            };

            const result = await aiResponseService.generateResponse(params);

            expect(result.response).toBe(
                "Hello! I'm here to help you with any questions you might have about our services."
            );
            expect(result.metadata.method).toBe("openai_greeting");
            expect(mockCreate).toHaveBeenCalledWith({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: expect.stringContaining(
                            "friendly customer service assistant"
                        ),
                    },
                    {
                        role: "user",
                        content: expect.stringContaining("Hello there"),
                    },
                ],
                temperature: 0.7,
                max_tokens: 300,
            });
        });

        it("should detect greeting patterns correctly", () => {
            expect(
                aiResponseService.isGreetingOrGeneralInteraction("Hello there")
            ).toBe(true);
            expect(aiResponseService.isGreetingOrGeneralInteraction("Hi")).toBe(
                true
            );
            expect(
                aiResponseService.isGreetingOrGeneralInteraction("Good morning")
            ).toBe(true);
            expect(
                aiResponseService.isGreetingOrGeneralInteraction("How are you?")
            ).toBe(true);
            expect(
                aiResponseService.isGreetingOrGeneralInteraction(
                    "Can you help me?"
                )
            ).toBe(true);
            expect(
                aiResponseService.isGreetingOrGeneralInteraction("Thanks")
            ).toBe(true);
            expect(
                aiResponseService.isGreetingOrGeneralInteraction(
                    "What services do you offer?"
                )
            ).toBe(false);
            expect(
                aiResponseService.isGreetingOrGeneralInteraction(
                    "What is your pricing?"
                )
            ).toBe(false);
        });
    });
});
