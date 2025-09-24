const request = require("supertest");

// Mock the models for integration tests
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
        findOrCreate: jest.fn(),
    },
    Business: {
        findByPk: jest.fn(),
    },
    sequelize: {
        authenticate: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
    },
}));

// Mock authentication middleware
jest.mock("../../src/middleware/auth", () => ({
    authenticateToken: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({ error: "Access denied. No token provided." });
        }
        const token = authHeader.substring(7);
        if (token === "valid_jwt_token") {
            req.user = { id: 1, businessId: 1 };
            req.business = { id: 1, owner_id: 1 };
            next();
        } else {
            return res.status(403).json({ error: "Invalid token." });
        }
    },
    checkBusinessOwnership: (req, res, next) => {
        next();
    },
    optionalAuth: (req, res, next) => {
        next();
    },
}));

const app = require("../../src/app");
const {
    Conversation,
    Message,
    Client,
    PlatformSource,
    Business,
} = require("../../src/models");

describe("Webhook Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.VERIFY_TOKEN = "test_verify_token";
        process.env.INSTAGRAM_TEST_TOKEN = "test_instagram_token";
    });

    describe("GET /webhooks/instagram/verify", () => {
        it("should verify webhook successfully", async () => {
            const response = await request(app)
                .get("/webhooks/instagram/verify")
                .query({
                    "hub.mode": "subscribe",
                    "hub.verify_token": "test_verify_token",
                    "hub.challenge": "test_challenge",
                });

            expect(response.status).toBe(200);
            expect(response.text).toBe("test_challenge");
        });

        it("should return 403 for incorrect verify token", async () => {
            const response = await request(app)
                .get("/webhooks/instagram/verify")
                .query({
                    "hub.mode": "subscribe",
                    "hub.verify_token": "wrong_token",
                    "hub.challenge": "test_challenge",
                });

            expect(response.status).toBe(403);
        });

        it("should return 403 for incorrect mode", async () => {
            const response = await request(app)
                .get("/webhooks/instagram/verify")
                .query({
                    "hub.mode": "unsubscribe",
                    "hub.verify_token": "test_verify_token",
                    "hub.challenge": "test_challenge",
                });

            expect(response.status).toBe(403);
        });

        it("should handle missing query parameters", async () => {
            const response = await request(app).get(
                "/webhooks/instagram/verify"
            );

            expect(response.status).toBe(403); // Should return 403 for missing parameters
        }, 15000); // Add 15 second timeout
    });

    describe("POST /webhooks/instagram/webhook", () => {
        beforeEach(() => {
            // Mock the webhook controller methods
            const WebhookController = require("../../src/controllers/WebhookController");
            jest.spyOn(WebhookController, "handleMessage").mockResolvedValue();
            jest.spyOn(WebhookController, "handlePostback").mockResolvedValue();
        });

        it("should handle Instagram message webhook", async () => {
            const webhookPayload = {
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

            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .send(webhookPayload);

            expect(response.status).toBe(200);
            expect(response.text).toBe("EVENT_RECEIVED");
        });

        it("should handle Instagram postback webhook", async () => {
            const webhookPayload = {
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

            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .send(webhookPayload);

            expect(response.status).toBe(200);
            expect(response.text).toBe("EVENT_RECEIVED");
        });

        it("should return 404 for non-Instagram events", async () => {
            const webhookPayload = {
                object: "facebook",
                entry: [],
            };

            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .send(webhookPayload);

            expect(response.status).toBe(404);
        });

        it("should handle multiple entries", async () => {
            const webhookPayload = {
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

            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .send(webhookPayload);

            expect(response.status).toBe(200);
            expect(response.text).toBe("EVENT_RECEIVED");
        });

        it("should handle empty entry array", async () => {
            const webhookPayload = {
                object: "instagram",
                entry: [],
            };

            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .send(webhookPayload);

            expect(response.status).toBe(200);
            expect(response.text).toBe("EVENT_RECEIVED");
        });
    });

    describe("POST /webhooks/instagram/fixed-token", () => {
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
            Business.findByPk.mockResolvedValue(mockBusiness);
            PlatformSource.findOrCreate.mockResolvedValue([
                mockPlatformSource,
                true,
            ]);
        });

        it("should create fixed token connection successfully", async () => {
            const response = await request(app)
                .post("/webhooks/instagram/fixed-token")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ businessId: 1 });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe(
                "Fixed token connection created successfully"
            );
            expect(response.body.platformSource).toBeDefined();
            expect(response.body.platformSource.platform_type).toBe(
                "instagram"
            );
        });

        it("should return 400 for missing businessId", async () => {
            const response = await request(app)
                .post("/webhooks/instagram/fixed-token")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Business ID is required");
        });

        it("should return 404 for non-existent business", async () => {
            Business.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .post("/webhooks/instagram/fixed-token")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ businessId: 999 });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("Business not found");
        });

        it("should handle database errors", async () => {
            Business.findByPk.mockRejectedValue(new Error("Database error"));

            const response = await request(app)
                .post("/webhooks/instagram/fixed-token")
                .set("Authorization", "Bearer valid_jwt_token")
                .send({ businessId: 1 });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Internal server error");
        });

        it("should require authentication", async () => {
            const response = await request(app)
                .post("/webhooks/instagram/fixed-token")
                .send({ businessId: 1 });

            expect(response.status).toBe(401);
        });
    });

    describe("Webhook Rate Limiting", () => {
        it("should not apply rate limiting to webhook endpoints", async () => {
            // Make multiple requests to webhook endpoint
            const requests = Array(10)
                .fill()
                .map(() =>
                    request(app).get("/webhooks/instagram/verify").query({
                        "hub.mode": "subscribe",
                        "hub.verify_token": "test_verify_token",
                        "hub.challenge": "test_challenge",
                    })
                );

            const responses = await Promise.all(requests);

            // All requests should succeed (no rate limiting)
            responses.forEach((response) => {
                expect(response.status).toBe(200);
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle malformed webhook payloads", async () => {
            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .send({ invalid: "payload" });

            expect(response.status).toBe(404);
        });

        it("should handle missing messaging array", async () => {
            const webhookPayload = {
                object: "instagram",
                entry: [
                    {
                        // Missing messaging array
                    },
                ],
            };

            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .send(webhookPayload);

            expect(response.status).toBe(200);
        });

        it("should handle empty messaging array", async () => {
            const webhookPayload = {
                object: "instagram",
                entry: [
                    {
                        messaging: [],
                    },
                ],
            };

            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .send(webhookPayload);

            expect(response.status).toBe(200);
        });
    });

    describe("CORS Configuration", () => {
        it("should allow CORS for webhook endpoints", async () => {
            const response = await request(app)
                .options("/webhooks/instagram/webhook")
                .set("Origin", "https://example.com")
                .set("Access-Control-Request-Method", "POST");

            expect(response.status).toBe(204); // OPTIONS request should return 204
        });
    });

    describe("Content Type Handling", () => {
        it("should handle JSON payloads", async () => {
            const webhookPayload = {
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

            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .set("Content-Type", "application/json")
                .send(webhookPayload);

            expect(response.status).toBe(200);
        });

        it("should handle URL-encoded payloads", async () => {
            const response = await request(app)
                .post("/webhooks/instagram/webhook")
                .set("Content-Type", "application/x-www-form-urlencoded")
                .send(
                    "object=instagram&entry[0][messaging][0][sender][id]=test_user_123"
                );

            expect(response.status).toBe(200);
        });
    });
});
