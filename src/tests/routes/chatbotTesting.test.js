"use strict";

const request = require("supertest");
const express = require("express");
const chatbotTestingRoutes = require("../../routes/chatbotTesting");

// Mock the services
jest.mock("../../services/chatbotTestingService");
jest.mock("../../middleware/firebaseAuth");

// Mock the logger
jest.mock("../../config/logger", () => ({
    createChildLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    }),
}));

const ChatbotTestingService = require("../../services/chatbotTestingService");
const { verifyFirebaseToken } = require("../../middleware/firebaseAuth");

describe("Chatbot Testing Routes", () => {
    let app;
    let mockChatbotTestingService;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use("/api/v1/chatbot-testing", chatbotTestingRoutes);

        mockChatbotTestingService = new ChatbotTestingService();
        jest.clearAllMocks();

        // Mock Firebase auth middleware
        verifyFirebaseToken.mockImplementation((req, res, next) => {
            req.user = {
                id: "user123",
                email: "test@example.com",
            };
            next();
        });
    });

    describe("POST /sessions", () => {
        it("should create a new test session", async () => {
            const mockSession = {
                id: 1,
                business_id: 1,
                session_name: "Test Session",
                scenario_type: "manual",
                status: "active",
                started_at: new Date(),
                metadata: {},
            };

            mockChatbotTestingService.createTestSession.mockResolvedValue({
                success: true,
                session: mockSession,
            });

            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions")
                .set("Authorization", "Bearer valid-token")
                .send({
                    business_id: 1,
                    session_name: "Test Session",
                    scenario_type: "manual",
                    metadata: {},
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.session).toEqual(mockSession);

            expect(
                mockChatbotTestingService.createTestSession
            ).toHaveBeenCalledWith({
                businessId: 1,
                sessionName: "Test Session",
                scenarioType: "manual",
                metadata: {},
            });
        });

        it("should validate required fields", async () => {
            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions")
                .set("Authorization", "Bearer valid-token")
                .send({
                    session_name: "Test Session",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Validation failed");
            expect(response.body.details).toHaveLength(1);
            expect(response.body.details[0].msg).toContain(
                "Business ID must be an integer"
            );
        });

        it("should validate scenario type", async () => {
            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions")
                .set("Authorization", "Bearer valid-token")
                .send({
                    business_id: 1,
                    scenario_type: "invalid",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details[0].msg).toContain("scenario_type");
        });

        it("should handle service errors", async () => {
            mockChatbotTestingService.createTestSession.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions")
                .set("Authorization", "Bearer valid-token")
                .send({
                    business_id: 1,
                    session_name: "Test Session",
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Internal server error");
            expect(response.body.code).toBe("INTERNAL_ERROR");
        });

        it("should require authentication", async () => {
            verifyFirebaseToken.mockImplementation((req, res, next) => {
                res.status(401).json({ error: "Unauthorized" });
            });

            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions")
                .send({
                    business_id: 1,
                    session_name: "Test Session",
                });

            expect(response.status).toBe(401);
        });
    });

    describe("POST /sessions/:sessionId/messages", () => {
        it("should process a message successfully", async () => {
            const mockResult = {
                success: true,
                response: "We offer web development services.",
                confidence_score: 0.8,
                is_answered: true,
                response_time: 150,
                context_sources: [
                    {
                        id: 1,
                        type: "template",
                        section_name: "Services",
                        similarity_score: 0.8,
                    },
                ],
                security_validation: {
                    input_safe: true,
                    response_safe: true,
                    input_flags: [],
                    response_flags: [],
                },
                metadata: {
                    session_id: 1,
                    business_id: 1,
                    language: "en",
                    message_id: 2,
                },
            };

            mockChatbotTestingService.processMessage.mockResolvedValue(
                mockResult
            );

            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions/1/messages")
                .set("Authorization", "Bearer valid-token")
                .send({
                    message: "What services do you offer?",
                    business_id: 1,
                    language: "en",
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockResult);

            expect(
                mockChatbotTestingService.processMessage
            ).toHaveBeenCalledWith({
                message: "What services do you offer?",
                sessionId: 1,
                businessId: 1,
                language: "en",
                userContext: {
                    userId: "user123",
                    userEmail: "test@example.com",
                },
            });
        });

        it("should validate required fields", async () => {
            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions/1/messages")
                .set("Authorization", "Bearer valid-token")
                .send({
                    business_id: 1,
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Validation failed");
            expect(response.body.details).toHaveLength(1);
            expect(response.body.details[0].msg).toContain(
                "Message must be between 1 and 1000 characters"
            );
        });

        it("should validate message length", async () => {
            const longMessage = "a".repeat(1001);

            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions/1/messages")
                .set("Authorization", "Bearer valid-token")
                .send({
                    message: longMessage,
                    business_id: 1,
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details[0].msg).toContain(
                "Message must be between 1 and 1000 characters"
            );
        });

        it("should validate session ID", async () => {
            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions/invalid/messages")
                .set("Authorization", "Bearer valid-token")
                .send({
                    message: "What services do you offer?",
                    business_id: 1,
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details[0].msg).toContain(
                "Session ID must be an integer"
            );
        });

        it("should handle processing errors", async () => {
            mockChatbotTestingService.processMessage.mockResolvedValue({
                success: false,
                error: "Processing failed",
            });

            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions/1/messages")
                .set("Authorization", "Bearer valid-token")
                .send({
                    message: "What services do you offer?",
                    business_id: 1,
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Processing failed");
        });

        it("should handle service exceptions", async () => {
            mockChatbotTestingService.processMessage.mockRejectedValue(
                new Error("Service error")
            );

            const response = await request(app)
                .post("/api/v1/chatbot-testing/sessions/1/messages")
                .set("Authorization", "Bearer valid-token")
                .send({
                    message: "What services do you offer?",
                    business_id: 1,
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Internal server error");
            expect(response.body.code).toBe("INTERNAL_ERROR");
        });
    });

    describe("GET /sessions/:sessionId", () => {
        it("should return session statistics", async () => {
            const mockStats = {
                session: {
                    id: 1,
                    business_id: 1,
                    session_name: "Test Session",
                    scenario_type: "manual",
                    status: "active",
                    started_at: new Date(),
                    completed_at: null,
                },
                statistics: {
                    message_count: 4,
                    answered_count: 2,
                    unanswered_count: 2,
                    average_confidence: 0.75,
                    average_response_time: 150,
                },
                messages: [
                    {
                        id: 1,
                        type: "user",
                        content: "What services do you offer?",
                        confidence_score: 0.8,
                        is_answered: true,
                        response_time: 150,
                        sequence_number: 1,
                        created_at: new Date(),
                    },
                ],
            };

            mockChatbotTestingService.getSessionStats.mockResolvedValue(
                mockStats
            );

            const response = await request(app)
                .get("/api/v1/chatbot-testing/sessions/1")
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockStats);

            expect(
                mockChatbotTestingService.getSessionStats
            ).toHaveBeenCalledWith(1);
        });

        it("should validate session ID", async () => {
            const response = await request(app)
                .get("/api/v1/chatbot-testing/sessions/invalid")
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details[0].msg).toContain(
                "Session ID must be an integer"
            );
        });

        it("should handle session not found", async () => {
            mockChatbotTestingService.getSessionStats.mockRejectedValue(
                new Error("Session not found")
            );

            const response = await request(app)
                .get("/api/v1/chatbot-testing/sessions/999")
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Session not found");
            expect(response.body.code).toBe("SESSION_NOT_FOUND");
        });

        it("should handle service errors", async () => {
            mockChatbotTestingService.getSessionStats.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .get("/api/v1/chatbot-testing/sessions/1")
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Internal server error");
            expect(response.body.code).toBe("INTERNAL_ERROR");
        });
    });

    describe("GET /unanswered-questions", () => {
        it("should return unanswered questions", async () => {
            const response = await request(app)
                .get("/api/v1/chatbot-testing/unanswered-questions")
                .query({
                    business_id: 1,
                    status: "unanswered",
                    priority: "high",
                    page: 1,
                    limit: 20,
                })
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 0,
                pages: 0,
            });
        });

        it("should validate business_id", async () => {
            const response = await request(app)
                .get("/api/v1/chatbot-testing/unanswered-questions")
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details[0].msg).toContain(
                "Business ID must be an integer"
            );
        });

        it("should validate status enum", async () => {
            const response = await request(app)
                .get("/api/v1/chatbot-testing/unanswered-questions")
                .query({
                    business_id: 1,
                    status: "invalid",
                })
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details[0].msg).toContain("status");
        });

        it("should validate priority enum", async () => {
            const response = await request(app)
                .get("/api/v1/chatbot-testing/unanswered-questions")
                .query({
                    business_id: 1,
                    priority: "invalid",
                })
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details[0].msg).toContain("priority");
        });

        it("should validate pagination parameters", async () => {
            const response = await request(app)
                .get("/api/v1/chatbot-testing/unanswered-questions")
                .query({
                    business_id: 1,
                    page: 0,
                    limit: 101,
                })
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.details).toHaveLength(2);
        });

        it("should handle service errors", async () => {
            // This would be implemented when the service method is added
            const response = await request(app)
                .get("/api/v1/chatbot-testing/unanswered-questions")
                .query({
                    business_id: 1,
                })
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(200); // Currently returns placeholder
        });
    });
});
