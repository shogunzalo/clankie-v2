const request = require("supertest");

// Mock the models before importing the app
jest.mock("../../src/models/index", () => ({
    Conversation: {
        findAndCountAll: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        sequelize: {
            fn: jest.fn(),
        },
    },
    Message: {
        findAll: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        sequelize: {
            fn: jest.fn(),
        },
    },
    Lead: {
        findByPk: jest.fn(),
    },
    Client: {},
    Activity: {
        logActivity: jest.fn(),
    },
    InstagramConnection: {},
    sequelize: {
        authenticate: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
    },
}));

// Mock the authentication middleware
jest.mock("../../src/middleware/auth", () => ({
    authenticateToken: (req, res, next) => {
        // Check if Authorization header is present
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        req.clientId = "client_12345678";
        next();
    },
}));

// Mock the validation middleware
jest.mock("../../src/middleware/validation", () => ({
    validateId: (req, res, next) => next(),
    validatePagination: (req, res, next) => next(),
    handleValidationErrors: (req, res, next) => {
        // Only validate userId for POST requests with userId in body
        if (
            req.method === "POST" &&
            req.body &&
            req.body.hasOwnProperty("userId") &&
            (req.body.userId === "" || !req.body.userId)
        ) {
            return res.status(400).json({ error: "Validation failed" });
        }
        next();
    },
    validateBusiness: (req, res, next) => next(),
    validateClient: (req, res, next) => next(),
    validateConversation: (req, res, next) => next(),
    validateMessage: (req, res, next) => next(),
    validateFaqItem: (req, res, next) => next(),
    validateService: (req, res, next) => next(),
}));

// Mock axios
jest.mock("axios");

const app = require("../../src/app");
const {
    Conversation,
    Message,
    Lead,
    Client,
    Activity,
} = require("../../src/models");
const axios = require("axios");

describe("Conversation Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/conversations", () => {
        const mockConversations = [
            {
                id: 1,
                userId: "user_123",
                userName: "John Doe",
                currentState: "active",
                isActive: true,
                lastMessageAt: new Date(),
                client: { companyName: "Test Company" },
                lead: { status: "new", leadScore: 75 },
            },
        ];

        beforeEach(() => {
            Conversation.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockConversations,
            });
        });

        it("should get conversations successfully", async () => {
            const response = await request(app)
                .get("/api/v1/conversations")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.conversations).toHaveLength(1);
            expect(response.body.data.pagination).toMatchObject({
                total: 1,
                page: 1,
                pages: 1,
                limit: 20,
            });
        });

        it("should handle pagination parameters", async () => {
            const response = await request(app)
                .get("/api/v1/conversations?page=2&limit=10")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.data.pagination).toMatchObject({
                page: 2,
                limit: 10,
            });
        });

        it("should handle filtering parameters", async () => {
            const response = await request(app)
                .get(
                    "/api/v1/conversations?state=active&isActive=true&search=John"
                )
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(Conversation.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        clientId: "client_12345678",
                        currentState: "active",
                        isActive: true,
                    }),
                })
            );
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app).get("/api/v1/conversations");

            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/conversations", () => {
        const validConversationData = {
            userId: "user_123",
            userName: "John Doe",
            instagramUsername: "johndoe",
            platformSourceId: 1,
        };

        const mockCreatedConversation = {
            id: 1,
            clientId: "client_12345678",
            userId: "user_123",
            userName: "John Doe",
            instagramUsername: "johndoe",
            platformSourceId: 1,
            currentState: "initial_contact",
            isActive: true,
            messageCount: 0,
            lastMessageAt: new Date(),
        };

        beforeEach(() => {
            Conversation.create.mockResolvedValue(mockCreatedConversation);
        });

        it("should create a conversation successfully", async () => {
            const response = await request(app)
                .post("/api/v1/conversations")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(validConversationData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                clientId: "client_12345678",
                userId: "user_123",
                userName: "John Doe",
                instagramUsername: "johndoe",
                platformSourceId: 1,
                currentState: "initial_contact",
                isActive: true,
            });
        });

        it("should create conversation with minimal data", async () => {
            const minimalData = {
                clientId: 1,
                platformSourceId: 1,
            };

            const response = await request(app)
                .post("/api/v1/conversations")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(minimalData);

            expect(response.status).toBe(201);
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app)
                .post("/api/v1/conversations")
                .send(validConversationData);

            expect(response.status).toBe(401);
        });

        it("should handle database errors", async () => {
            Conversation.create.mockRejectedValue(new Error("Database error"));

            const response = await request(app)
                .post("/api/v1/conversations")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(validConversationData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Database error");
        });
    });

    describe("GET /api/conversations/:id", () => {
        const mockConversation = {
            id: 1,
            userId: "user_123",
            userName: "John Doe",
            currentState: "active",
            client: { companyName: "Test Company", businessType: "Technology" },
            lead: { status: "new", leadScore: 75 },
            messages: [
                {
                    id: 1,
                    messageText: "Hello!",
                    senderType: "user",
                    timestamp: new Date(),
                },
            ],
        };

        beforeEach(() => {
            Conversation.findByPk.mockResolvedValue(mockConversation);
        });

        it("should get a conversation successfully", async () => {
            const response = await request(app)
                .get("/api/v1/conversations/1")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                id: 1,
                userId: "user_123",
                userName: "John Doe",
                currentState: "active",
            });
        });

        it("should return 404 for non-existent conversation", async () => {
            Conversation.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/v1/conversations/999")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Conversation not found");
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app).get("/api/v1/conversations/1");

            expect(response.status).toBe(401);
        });
    });

    describe("PUT /api/conversations/:id", () => {
        const mockConversation = {
            id: 1,
            userId: "user_123",
            userName: "John Doe",
            update: jest.fn(),
        };

        const updateData = {
            userName: "John Updated",
            currentState: "engaged",
        };

        beforeEach(() => {
            Conversation.findByPk.mockResolvedValue(mockConversation);
            mockConversation.update.mockResolvedValue();
        });

        it("should update a conversation successfully", async () => {
            const response = await request(app)
                .put("/api/v1/conversations/1")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockConversation.update).toHaveBeenCalledWith(updateData);
        });

        it("should return 404 for non-existent conversation", async () => {
            Conversation.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .put("/api/v1/conversations/999")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Conversation not found");
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app)
                .put("/api/v1/conversations/1")
                .send(updateData);

            expect(response.status).toBe(401);
        });
    });

    describe("DELETE /api/conversations/:id", () => {
        const mockConversation = {
            id: 1,
            userId: "user_123",
            userName: "John Doe",
            destroy: jest.fn(),
        };

        beforeEach(() => {
            Conversation.findByPk.mockResolvedValue(mockConversation);
            mockConversation.destroy.mockResolvedValue();
        });

        it("should delete a conversation successfully", async () => {
            const response = await request(app)
                .delete("/api/v1/conversations/1")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Conversation deleted successfully"
            );
            expect(mockConversation.destroy).toHaveBeenCalled();
        });

        it("should return 404 for non-existent conversation", async () => {
            Conversation.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .delete("/api/v1/conversations/999")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Conversation not found");
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app).delete(
                "/api/v1/conversations/1"
            );

            expect(response.status).toBe(401);
        });
    });

    describe("PATCH /api/conversations/:id/state", () => {
        const mockConversation = {
            id: 1,
            currentState: "initial_contact",
            clientId: "client_12345678",
            updateState: jest.fn(),
        };

        beforeEach(() => {
            Conversation.findByPk.mockResolvedValue(mockConversation);
            mockConversation.updateState.mockResolvedValue();
            Activity.logActivity.mockResolvedValue();
        });

        it("should update conversation state successfully", async () => {
            const response = await request(app)
                .patch("/api/v1/conversations/1/state")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ state: "engaged" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockConversation.updateState).toHaveBeenCalledWith(
                "engaged"
            );
            expect(Activity.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    clientId: "client_12345678",
                    conversationId: 1,
                    type: "state_change",
                    title: "Conversation state updated",
                    description:
                        "State changed from initial_contact to engaged",
                    data: { oldState: "initial_contact", newState: "engaged" },
                    performedBy: "user",
                })
            );
        });

        it("should return 404 for non-existent conversation", async () => {
            Conversation.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .patch("/api/v1/conversations/999/state")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ state: "engaged" });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Conversation not found");
        });
    });

    describe("GET /api/conversations/:id/messages", () => {
        const mockMessages = [
            {
                id: 1,
                messageText: "Hello!",
                senderType: "user",
                timestamp: new Date("2023-01-01T10:00:00Z"),
            },
            {
                id: 2,
                messageText: "Hi there!",
                senderType: "agent",
                timestamp: new Date("2023-01-01T10:01:00Z"),
            },
        ];

        beforeEach(() => {
            Message.findAll.mockResolvedValue(mockMessages);
        });

        it("should get messages successfully", async () => {
            const response = await request(app)
                .get("/api/v1/conversations/1/messages")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(Message.findAll).toHaveBeenCalledWith({
                where: { conversationId: "1" },
                limit: 50,
                offset: 0,
                order: [["timestamp", "DESC"]],
            });
        });

        it("should handle pagination parameters", async () => {
            const response = await request(app)
                .get("/api/v1/conversations/1/messages?page=2&limit=25")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(Message.findAll).toHaveBeenCalledWith({
                where: { conversationId: "1" },
                limit: 25,
                offset: 25,
                order: [["timestamp", "DESC"]],
            });
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app).get(
                "/api/v1/conversations/1/messages"
            );

            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/conversations/:id/messages", () => {
        const mockConversation = {
            id: 1,
            userId: "user_123",
            clientId: "client_12345678",
            client: {
                instagramConnection: {
                    status: "active",
                    accessToken: "test_token",
                },
            },
            incrementMessageCount: jest.fn(),
        };

        const mockNewMessage = {
            id: 1,
            conversationId: "1",
            clientId: "client_12345678",
            senderType: "agent",
            messageText: "Hello!",
            timestamp: new Date(),
            isAutomated: false,
        };

        beforeEach(() => {
            Conversation.findByPk.mockResolvedValue(mockConversation);
            Message.create.mockResolvedValue(mockNewMessage);
            mockConversation.incrementMessageCount.mockResolvedValue();
            axios.post.mockResolvedValue({ data: { success: true } });
        });

        it("should send message successfully", async () => {
            const response = await request(app)
                .post("/api/v1/conversations/1/messages")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ message: "Hello!", senderType: "agent" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                conversationId: "1",
                clientId: "client_12345678",
                senderType: "agent",
                messageText: "Hello!",
            });

            expect(axios.post).toHaveBeenCalledWith(
                "https://graph.facebook.com/v18.0/me/messages",
                {
                    recipient: { id: "user_123" },
                    message: { text: "Hello!" },
                },
                {
                    params: { access_token: "test_token" },
                }
            );

            expect(Message.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    conversationId: "1",
                    clientId: "client_12345678",
                    senderType: "agent",
                    messageText: "Hello!",
                    isAutomated: false,
                })
            );

            expect(mockConversation.incrementMessageCount).toHaveBeenCalled();
        });

        it("should handle bot messages", async () => {
            const response = await request(app)
                .post("/api/v1/conversations/1/messages")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ message: "Auto response", senderType: "bot" });

            expect(response.status).toBe(200);
            expect(Message.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    senderType: "bot",
                    isAutomated: true,
                })
            );
        });

        it("should return 404 for non-existent conversation", async () => {
            Conversation.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .post("/api/v1/conversations/999/messages")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ message: "Hello!" });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Conversation not found");
        });

        it("should handle Instagram API errors", async () => {
            axios.post.mockRejectedValue({
                response: { data: { error: "Invalid token" } },
            });

            const response = await request(app)
                .post("/api/v1/conversations/1/messages")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ message: "Hello!" });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(
                "Failed to send message via Instagram"
            );
        });
    });

    describe("GET /api/conversations/:id/stats", () => {
        const mockConversation = {
            id: 1,
            currentState: "active",
            isActive: true,
            messageCount: 5,
            leadId: 1,
            createdAt: new Date("2023-01-01T10:00:00Z"),
            lastMessageAt: new Date("2023-01-01T11:00:00Z"),
        };

        const mockMessageStats = [
            { senderType: "user", count: "3" },
            { senderType: "agent", count: "2" },
        ];

        const mockLead = {
            status: "new",
            leadScore: 75,
            createdAt: new Date("2023-01-01T10:00:00Z"),
            lastInteractionAt: new Date("2023-01-01T11:00:00Z"),
        };

        beforeEach(() => {
            Conversation.findByPk.mockResolvedValue(mockConversation);
            Message.count.mockResolvedValue(5);
            Message.findAll.mockResolvedValue(mockMessageStats);
            Lead.findByPk.mockResolvedValue(mockLead);
        });

        it("should get conversation stats successfully", async () => {
            const response = await request(app)
                .get("/api/v1/conversations/1/stats")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                conversationId: "1",
                currentState: "active",
                isActive: true,
                messageCount: 5,
                totalMessages: 5,
                messageStats: mockMessageStats,
                leadStats: {
                    status: "new",
                    leadScore: 75,
                },
            });
        });

        it("should return 404 for non-existent conversation", async () => {
            Conversation.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/v1/conversations/999/stats")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Conversation not found");
        });
    });

    describe("Error Handling", () => {
        it("should handle malformed conversation IDs", async () => {
            const response = await request(app)
                .get("/api/v1/conversations/invalid-id")
                .set("Authorization", "Bearer valid_jwt_token");

            // The validation middleware might return 400 or the conversation lookup might return 404
            expect([400, 404]).toContain(response.status);
        });

        it("should handle database connection errors", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database connection failed")
            );

            const response = await request(app)
                .get("/api/v1/conversations/1")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Database connection failed");
        });
    });

    describe("CORS Configuration", () => {
        it("should allow CORS for conversation endpoints", async () => {
            const response = await request(app)
                .options("/api/v1/conversations")
                .set("Origin", "https://example.com")
                .set("Access-Control-Request-Method", "GET");

            // CORS headers might be set by the middleware
            expect(response.status).toBe(204);
        });
    });
});
