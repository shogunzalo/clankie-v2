const ConversationController = require("../../src/controllers/ConversationController");
const {
    Conversation,
    Message,
    Lead,
    Client,
    Activity,
} = require("../../src/models");
const { Op } = require("sequelize");
const axios = require("axios");

// Mock the models
jest.mock("../../src/models", () => ({
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
}));

// Mock axios
jest.mock("axios");

describe("ConversationController", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            query: {},
            params: {},
            body: {},
            clientId: "client_12345678",
        };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe("getConversations", () => {
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
            {
                id: 2,
                userId: "user_456",
                userName: "Jane Smith",
                currentState: "closed",
                isActive: false,
                lastMessageAt: new Date(),
                client: { companyName: "Test Company" },
                lead: { status: "won", leadScore: 90 },
            },
        ];

        beforeEach(() => {
            Conversation.findAndCountAll.mockResolvedValue({
                count: 2,
                rows: mockConversations,
            });
        });

        it("should get conversations successfully with default pagination", async () => {
            await ConversationController.getConversations(mockReq, mockRes);

            expect(Conversation.findAndCountAll).toHaveBeenCalledWith({
                where: { clientId: "client_12345678" },
                limit: 20,
                offset: 0,
                include: [
                    {
                        model: Client,
                        as: "client",
                        attributes: ["companyName"],
                    },
                    {
                        model: Lead,
                        as: "lead",
                        attributes: ["status", "leadScore"],
                    },
                ],
                order: [["lastMessageAt", "DESC"]],
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    conversations: mockConversations,
                    pagination: {
                        total: 2,
                        page: 1,
                        pages: 1,
                        limit: 20,
                    },
                },
            });
        });

        it("should handle pagination parameters", async () => {
            mockReq.query = { page: 2, limit: 10 };

            await ConversationController.getConversations(mockReq, mockRes);

            expect(Conversation.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                    offset: 10,
                })
            );

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        pagination: {
                            total: 2,
                            page: 2,
                            pages: 1,
                            limit: 10,
                        },
                    }),
                })
            );
        });

        it("should handle filtering parameters", async () => {
            mockReq.query = {
                state: "active",
                isActive: "true",
                search: "John",
            };

            await ConversationController.getConversations(mockReq, mockRes);

            expect(Conversation.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        clientId: "client_12345678",
                        currentState: "active",
                        isActive: true,
                        [Op.or]: [
                            { userName: { [Op.iLike]: "%John%" } },
                            { instagramUsername: { [Op.iLike]: "%John%" } },
                        ],
                    },
                })
            );
        });

        it("should handle errors", async () => {
            Conversation.findAndCountAll.mockRejectedValue(
                new Error("Database error")
            );

            await ConversationController.getConversations(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("getConversation", () => {
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
            mockReq.params = { id: "1" };

            await ConversationController.getConversation(mockReq, mockRes);

            expect(Conversation.findByPk).toHaveBeenCalledWith("1", {
                include: [
                    {
                        model: Client,
                        as: "client",
                        attributes: ["companyName", "businessType"],
                    },
                    {
                        model: Lead,
                        as: "lead",
                    },
                    {
                        model: Message,
                        as: "messages",
                        limit: 50,
                        order: [["timestamp", "ASC"]],
                    },
                ],
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockConversation,
            });
        });

        it("should return 404 if conversation not found", async () => {
            Conversation.findByPk.mockResolvedValue(null);
            mockReq.params = { id: "999" };

            await ConversationController.getConversation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Conversation not found",
            });
        });

        it("should handle errors", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database error")
            );
            mockReq.params = { id: "1" };

            await ConversationController.getConversation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("updateState", () => {
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
            mockReq.params = { id: "1" };
            mockReq.body = { state: "engaged" };

            await ConversationController.updateState(mockReq, mockRes);

            expect(Conversation.findByPk).toHaveBeenCalledWith("1");
            expect(mockConversation.updateState).toHaveBeenCalledWith(
                "engaged"
            );
            expect(Activity.logActivity).toHaveBeenCalledWith({
                clientId: "client_12345678",
                conversationId: 1,
                type: "state_change",
                title: "Conversation state updated",
                description: "State changed from initial_contact to engaged",
                data: { oldState: "initial_contact", newState: "engaged" },
                performedBy: "user",
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockConversation,
            });
        });

        it("should return 404 if conversation not found", async () => {
            Conversation.findByPk.mockResolvedValue(null);
            mockReq.params = { id: "999" };
            mockReq.body = { state: "engaged" };

            await ConversationController.updateState(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Conversation not found",
            });
        });

        it("should handle errors", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database error")
            );
            mockReq.params = { id: "1" };
            mockReq.body = { state: "engaged" };

            await ConversationController.updateState(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("getMessages", () => {
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

        it("should get messages successfully with default pagination", async () => {
            mockReq.params = { id: "1" };

            await ConversationController.getMessages(mockReq, mockRes);

            expect(Message.findAll).toHaveBeenCalledWith({
                where: { conversationId: "1" },
                limit: 50,
                offset: 0,
                order: [["timestamp", "DESC"]],
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockMessages.reverse(),
            });
        });

        it("should handle pagination parameters", async () => {
            mockReq.params = { id: "1" };
            mockReq.query = { page: 2, limit: 25 };

            await ConversationController.getMessages(mockReq, mockRes);

            expect(Message.findAll).toHaveBeenCalledWith({
                where: { conversationId: "1" },
                limit: 25,
                offset: 25,
                order: [["timestamp", "DESC"]],
            });
        });

        it("should handle errors", async () => {
            Message.findAll.mockRejectedValue(new Error("Database error"));
            mockReq.params = { id: "1" };

            await ConversationController.getMessages(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("sendMessage", () => {
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
            mockReq.params = { id: "1" };
            mockReq.body = { message: "Hello!", senderType: "agent" };

            await ConversationController.sendMessage(mockReq, mockRes);

            expect(Conversation.findByPk).toHaveBeenCalledWith("1", {
                include: [
                    {
                        model: Client,
                        as: "client",
                        include: [
                            {
                                model: require("../../src/models")
                                    .InstagramConnection,
                                as: "instagramConnection",
                            },
                        ],
                    },
                ],
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

            expect(Message.create).toHaveBeenCalledWith({
                conversationId: "1",
                clientId: "client_12345678",
                senderType: "agent",
                messageText: "Hello!",
                timestamp: expect.any(Date),
                isAutomated: false,
            });

            expect(mockConversation.incrementMessageCount).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockNewMessage,
            });
        });

        it("should handle bot messages", async () => {
            mockReq.params = { id: "1" };
            mockReq.body = { message: "Auto response", senderType: "bot" };

            await ConversationController.sendMessage(mockReq, mockRes);

            expect(Message.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    senderType: "bot",
                    isAutomated: true,
                })
            );
        });

        it("should return 404 if conversation not found", async () => {
            Conversation.findByPk.mockResolvedValue(null);
            mockReq.params = { id: "999" };
            mockReq.body = { message: "Hello!" };

            await ConversationController.sendMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Conversation not found",
            });
        });

        it("should handle Instagram API errors", async () => {
            axios.post.mockRejectedValue({
                response: { data: { error: "Invalid token" } },
            });
            mockReq.params = { id: "1" };
            mockReq.body = { message: "Hello!" };

            await ConversationController.sendMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Failed to send message via Instagram",
            });
        });

        it("should handle errors", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database error")
            );
            mockReq.params = { id: "1" };
            mockReq.body = { message: "Hello!" };

            await ConversationController.sendMessage(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("createConversation", () => {
        const mockNewConversation = {
            id: 1,
            clientId: "client_12345678",
            userId: "user_123",
            userName: "John Doe",
            instagramUsername: "johndoe",
            platformSourceId: 1,
            currentState: "initial_contact",
            isActive: true,
            messageCount: 0,
            lastMessageAt: expect.any(Date),
        };

        beforeEach(() => {
            Conversation.create.mockResolvedValue(mockNewConversation);
        });

        it("should create a conversation successfully", async () => {
            mockReq.body = {
                userId: "user_123",
                userName: "John Doe",
                instagramUsername: "johndoe",
                platformSourceId: 1,
            };

            await ConversationController.createConversation(mockReq, mockRes);

            expect(Conversation.create).toHaveBeenCalledWith({
                clientId: "client_12345678",
                userId: "user_123",
                userName: "John Doe",
                instagramUsername: "johndoe",
                platformSourceId: 1,
                currentState: "initial_contact",
                isActive: true,
                messageCount: 0,
                lastMessageAt: expect.any(Date),
            });

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockNewConversation,
            });
        });

        it("should use custom currentState if provided", async () => {
            mockReq.body = {
                userId: "user_123",
                userName: "John Doe",
                currentState: "engaged",
            };

            await ConversationController.createConversation(mockReq, mockRes);

            expect(Conversation.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    currentState: "engaged",
                })
            );
        });

        it("should handle creation errors", async () => {
            Conversation.create.mockRejectedValue(
                new Error("Validation error")
            );
            mockReq.body = {
                userId: "user_123",
                userName: "John Doe",
            };

            await ConversationController.createConversation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Validation error",
            });
        });
    });

    describe("updateConversation", () => {
        const mockConversation = {
            id: 1,
            userId: "user_123",
            userName: "John Doe",
            update: jest.fn(),
        };

        beforeEach(() => {
            Conversation.findByPk.mockResolvedValue(mockConversation);
            mockConversation.update.mockResolvedValue();
        });

        it("should update a conversation successfully", async () => {
            mockReq.params = { id: "1" };
            mockReq.body = { userName: "John Updated" };

            await ConversationController.updateConversation(mockReq, mockRes);

            expect(Conversation.findByPk).toHaveBeenCalledWith("1");
            expect(mockConversation.update).toHaveBeenCalledWith({
                userName: "John Updated",
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockConversation,
            });
        });

        it("should return 404 if conversation not found", async () => {
            Conversation.findByPk.mockResolvedValue(null);
            mockReq.params = { id: "999" };
            mockReq.body = { userName: "John Updated" };

            await ConversationController.updateConversation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Conversation not found",
            });
        });

        it("should handle update errors", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database error")
            );
            mockReq.params = { id: "1" };
            mockReq.body = { userName: "John Updated" };

            await ConversationController.updateConversation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("deleteConversation", () => {
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
            mockReq.params = { id: "1" };

            await ConversationController.deleteConversation(mockReq, mockRes);

            expect(Conversation.findByPk).toHaveBeenCalledWith("1");
            expect(mockConversation.destroy).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Conversation deleted successfully",
            });
        });

        it("should return 404 if conversation not found", async () => {
            Conversation.findByPk.mockResolvedValue(null);
            mockReq.params = { id: "999" };

            await ConversationController.deleteConversation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Conversation not found",
            });
        });

        it("should handle delete errors", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database error")
            );
            mockReq.params = { id: "1" };

            await ConversationController.deleteConversation(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("getConversationStats", () => {
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
            mockReq.params = { id: "1" };

            await ConversationController.getConversationStats(mockReq, mockRes);

            expect(Conversation.findByPk).toHaveBeenCalledWith("1");
            expect(Message.count).toHaveBeenCalledWith({
                where: { conversationId: "1" },
            });
            expect(Message.findAll).toHaveBeenCalledWith({
                where: { conversationId: "1" },
                attributes: [
                    "senderType",
                    [Message.sequelize.fn("COUNT", "*"), "count"],
                ],
                group: ["senderType"],
                raw: true,
            });
            expect(Lead.findByPk).toHaveBeenCalledWith(1);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    conversationId: "1",
                    currentState: "active",
                    isActive: true,
                    messageCount: 5,
                    totalMessages: 5,
                    messageStats: mockMessageStats,
                    leadStats: {
                        status: "new",
                        leadScore: 75,
                        createdAt: mockLead.createdAt,
                        lastInteractionAt: mockLead.lastInteractionAt,
                    },
                    createdAt: mockConversation.createdAt,
                    lastMessageAt: mockConversation.lastMessageAt,
                },
            });
        });

        it("should handle conversation without lead", async () => {
            mockConversation.leadId = null;
            mockReq.params = { id: "1" };

            await ConversationController.getConversationStats(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        leadStats: null,
                    }),
                })
            );
        });

        it("should return 404 if conversation not found", async () => {
            Conversation.findByPk.mockResolvedValue(null);
            mockReq.params = { id: "999" };

            await ConversationController.getConversationStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Conversation not found",
            });
        });

        it("should handle errors", async () => {
            Conversation.findByPk.mockRejectedValue(
                new Error("Database error")
            );
            mockReq.params = { id: "1" };

            await ConversationController.getConversationStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });
});
