const WebhookController = require("../../src/controllers/WebhookController");
const {
    Conversation,
    Message,
    Client,
    PlatformSource,
    Business,
} = require("../../src/models");
const axios = require("axios");

// Mock the models
jest.mock("../../src/models", () => ({
    Conversation: {
        findByPk: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    },
    Message: {
        create: jest.fn(),
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

// Mock axios
jest.mock("axios");

describe("WebhookController", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            query: {},
            body: {},
            params: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            sendStatus: jest.fn(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe("verifyWebhook", () => {
        it("should verify webhook successfully with correct token", async () => {
            process.env.VERIFY_TOKEN = "test_verify_token";
            mockReq.query = {
                "hub.mode": "subscribe",
                "hub.verify_token": "test_verify_token",
                "hub.challenge": "test_challenge",
            };

            await WebhookController.verifyWebhook(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith("test_challenge");
        });

        it("should return 403 for incorrect token", async () => {
            process.env.VERIFY_TOKEN = "test_verify_token";
            mockReq.query = {
                "hub.mode": "subscribe",
                "hub.verify_token": "wrong_token",
                "hub.challenge": "test_challenge",
            };

            await WebhookController.verifyWebhook(mockReq, mockRes);

            expect(mockRes.sendStatus).toHaveBeenCalledWith(403);
        });

        it("should return 403 for incorrect mode", async () => {
            process.env.VERIFY_TOKEN = "test_verify_token";
            mockReq.query = {
                "hub.mode": "unsubscribe",
                "hub.verify_token": "test_verify_token",
                "hub.challenge": "test_challenge",
            };

            await WebhookController.verifyWebhook(mockReq, mockRes);

            expect(mockRes.sendStatus).toHaveBeenCalledWith(403);
        });

        it("should handle missing query parameters", async () => {
            mockReq.query = {};

            await WebhookController.verifyWebhook(mockReq, mockRes);

            expect(mockRes.sendStatus).not.toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });

    describe("handleWebhook", () => {
        beforeEach(() => {
            jest.spyOn(WebhookController, "handleMessage").mockResolvedValue();
            jest.spyOn(WebhookController, "handlePostback").mockResolvedValue();
        });

        it("should handle Instagram webhook events", async () => {
            mockReq.body = {
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
            };

            await WebhookController.handleWebhook(mockReq, mockRes);

            expect(WebhookController.handleMessage).toHaveBeenCalledWith(
                "test_user_123",
                { text: "Hello!" }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith("EVENT_RECEIVED");
        });

        it("should handle postback events", async () => {
            mockReq.body = {
                object: "instagram",
                entry: [
                    {
                        messaging: [
                            {
                                sender: { id: "test_user_123" },
                                postback: { payload: "yes" },
                            },
                        ],
                    },
                ],
            };

            await WebhookController.handleWebhook(mockReq, mockRes);

            expect(WebhookController.handlePostback).toHaveBeenCalledWith(
                "test_user_123",
                { payload: "yes" }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it("should return 404 for non-Instagram events", async () => {
            mockReq.body = {
                object: "facebook",
                entry: [],
            };

            await WebhookController.handleWebhook(mockReq, mockRes);

            expect(mockRes.sendStatus).toHaveBeenCalledWith(404);
        });

        it("should handle multiple entries", async () => {
            mockReq.body = {
                object: "instagram",
                entry: [
                    {
                        messaging: [
                            {
                                sender: { id: "user1" },
                                message: { text: "Hello 1" },
                            },
                        ],
                    },
                    {
                        messaging: [
                            {
                                sender: { id: "user2" },
                                message: { text: "Hello 2" },
                            },
                        ],
                    },
                ],
            };

            await WebhookController.handleWebhook(mockReq, mockRes);

            expect(WebhookController.handleMessage).toHaveBeenCalledTimes(2);
            expect(WebhookController.handleMessage).toHaveBeenCalledWith(
                "user1",
                { text: "Hello 1" }
            );
            expect(WebhookController.handleMessage).toHaveBeenCalledWith(
                "user2",
                { text: "Hello 2" }
            );
        });
    });

    describe("handleMessage", () => {
        it("should call handleMessageWithAI for message processing", async () => {
            const sender_psid = "test_user_123";
            const received_message = { text: "Hello!" };

            // Clear any existing spies first
            jest.restoreAllMocks();

            // Mock the handleMessageWithAI method
            const handleMessageWithAISpy = jest
                .spyOn(WebhookController, "handleMessageWithAI")
                .mockResolvedValue();

            await WebhookController.handleMessage(
                sender_psid,
                received_message
            );

            expect(handleMessageWithAISpy).toHaveBeenCalledWith(
                sender_psid,
                received_message,
                null
            );

            handleMessageWithAISpy.mockRestore();
        });

        it("should handle errors gracefully", async () => {
            const sender_psid = "test_user_123";
            const received_message = { text: "Hello!" };

            // Clear any existing spies first
            jest.restoreAllMocks();

            // Mock the handleMessageWithAI method to throw an error
            const handleMessageWithAISpy = jest
                .spyOn(WebhookController, "handleMessageWithAI")
                .mockRejectedValue(new Error("Processing error"));
            const callSendAPISpy = jest
                .spyOn(WebhookController, "callSendAPI")
                .mockResolvedValue();

            await WebhookController.handleMessage(
                sender_psid,
                received_message
            );

            expect(callSendAPISpy).toHaveBeenCalledWith(sender_psid, {
                text: "Thanks for your message! We'll get back to you soon.",
            });

            handleMessageWithAISpy.mockRestore();
            callSendAPISpy.mockRestore();
        });
    });

    describe("handlePostback", () => {
        it("should handle yes postback", async () => {
            const sender_psid = "test_user_123";
            const received_postback = { payload: "yes" };

            // Clear any existing spies first
            jest.restoreAllMocks();

            const callSendAPISpy = jest
                .spyOn(WebhookController, "callSendAPI")
                .mockResolvedValue();

            await WebhookController.handlePostback(
                sender_psid,
                received_postback
            );

            expect(callSendAPISpy).toHaveBeenCalledWith(sender_psid, {
                text: "Thanks!",
            });

            callSendAPISpy.mockRestore();
        });

        it("should handle no postback", async () => {
            const sender_psid = "test_user_123";
            const received_postback = { payload: "no" };

            // Clear any existing spies first
            jest.restoreAllMocks();

            const callSendAPISpy = jest
                .spyOn(WebhookController, "callSendAPI")
                .mockResolvedValue();

            await WebhookController.handlePostback(
                sender_psid,
                received_postback
            );

            expect(callSendAPISpy).toHaveBeenCalledWith(sender_psid, {
                text: "Oops, try sending another image.",
            });

            callSendAPISpy.mockRestore();
        });

        it("should handle unknown postback", async () => {
            const sender_psid = "test_user_123";
            const received_postback = { payload: "unknown" };

            // Clear any existing spies first
            jest.restoreAllMocks();

            const callSendAPISpy = jest
                .spyOn(WebhookController, "callSendAPI")
                .mockResolvedValue();

            await WebhookController.handlePostback(
                sender_psid,
                received_postback
            );

            expect(callSendAPISpy).toHaveBeenCalledWith(sender_psid, undefined);

            callSendAPISpy.mockRestore();
        });
    });

    describe("callSendAPI", () => {
        beforeEach(() => {
            process.env.INSTAGRAM_TEST_TOKEN = "test_token";
            axios.post.mockResolvedValue({ data: { success: true } });
        });

        it("should send message via Instagram API", async () => {
            const sender_psid = "test_user_123";
            const response = { text: "Hello!" };

            // Clear any existing spies first
            jest.restoreAllMocks();
            process.env.INSTAGRAM_TEST_TOKEN = "test_token";
            axios.post.mockResolvedValue({ data: { success: true } });

            await WebhookController.callSendAPI(sender_psid, response);

            expect(axios.post).toHaveBeenCalledWith(
                "https://graph.facebook.com/v2.6/me/messages?access_token=test_token",
                {
                    recipient: { id: sender_psid },
                    message: { text: "Hello!" },
                }
            );
        });

        it("should handle API errors", async () => {
            const sender_psid = "test_user_123";
            const response = { text: "Hello!" };

            // Clear any existing spies first
            jest.restoreAllMocks();
            process.env.INSTAGRAM_TEST_TOKEN = "test_token";
            axios.post.mockRejectedValue(new Error("API Error"));

            await expect(
                WebhookController.callSendAPI(sender_psid, response)
            ).rejects.toThrow("API Error");

            expect(axios.post).toHaveBeenCalled();
        });
    });

    describe("createFixedTokenConnection", () => {
        const mockBusiness = {
            id: 1,
            name: "Test Business",
        };

        const mockPlatformSource = {
            id: 1,
            platform_type: "instagram",
            platform_name: "instagram_fixed_token",
            is_active: true,
            last_sync: new Date(),
            update: jest.fn(),
        };

        beforeEach(() => {
            process.env.INSTAGRAM_TEST_TOKEN = "test_token";
            Business.findByPk.mockResolvedValue(mockBusiness);
            PlatformSource.findOrCreate = jest.fn();
        });

        it("should create fixed token connection successfully", async () => {
            PlatformSource.findOrCreate.mockResolvedValue([
                mockPlatformSource,
                true,
            ]);

            mockReq.body = { businessId: 1 };

            await WebhookController.createFixedTokenConnection(
                mockReq,
                mockRes
            );

            expect(Business.findByPk).toHaveBeenCalledWith(1);
            expect(PlatformSource.findOrCreate).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Fixed token connection created successfully",
                platformSource: {
                    id: 1,
                    platform_type: "instagram",
                    platform_name: "instagram_fixed_token",
                    is_active: true,
                    last_sync: expect.any(Date),
                },
            });
        });

        it("should update existing platform source", async () => {
            PlatformSource.findOrCreate.mockResolvedValue([
                mockPlatformSource,
                false,
            ]);

            mockReq.body = { businessId: 1 };

            await WebhookController.createFixedTokenConnection(
                mockReq,
                mockRes
            );

            expect(mockPlatformSource.update).toHaveBeenCalledWith({
                credentials: JSON.stringify({
                    access_token: "test_token",
                    page_id: "fixed_page_id",
                }),
                is_active: true,
                last_sync: expect.any(Date),
            });
        });

        it("should return 400 for missing businessId", async () => {
            mockReq.body = {};

            await WebhookController.createFixedTokenConnection(
                mockReq,
                mockRes
            );

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Business ID is required",
            });
        });

        it("should return 404 for non-existent business", async () => {
            Business.findByPk.mockResolvedValue(null);

            mockReq.body = { businessId: 999 };

            await WebhookController.createFixedTokenConnection(
                mockReq,
                mockRes
            );

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Business not found",
            });
        });

        it("should handle errors gracefully", async () => {
            Business.findByPk.mockRejectedValue(new Error("Database error"));

            mockReq.body = { businessId: 1 };

            await WebhookController.createFixedTokenConnection(
                mockReq,
                mockRes
            );

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: "Internal server error",
            });
        });
    });
});
