const request = require("supertest");

// Mock the models before importing the app
jest.mock("../../src/models/index", () => ({
    Business: {
        create: jest.fn(),
        findOne: jest.fn(),
        findAndCountAll: jest.fn(),
        count: jest.fn(),
    },
    Client: {
        findAndCountAll: jest.fn(),
        count: jest.fn(),
    },
    Conversation: {
        findAll: jest.fn(),
        count: jest.fn(),
        sequelize: {
            fn: jest.fn(),
        },
    },
    Lead: {
        findAll: jest.fn(),
        count: jest.fn(),
        sequelize: {
            fn: jest.fn(),
        },
    },
    PlatformSource: {
        findAll: jest.fn(),
        sequelize: {
            fn: jest.fn(),
        },
    },
    Service: {
        findAll: jest.fn(),
    },
    FaqItem: {
        findAll: jest.fn(),
    },
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
        req.user = { businessId: "biz_12345678" };
        next();
    },
}));

// Mock the validation middleware
jest.mock("../../src/middleware/validation", () => ({
    validateBusiness: (req, res, next) => {
        // Check for invalid data
        if (req.body.company_name === "" || !req.body.company_name) {
            return res.status(400).json({ error: "Validation failed" });
        }
        next();
    },
    validateId: (req, res, next) => next(),
    validatePagination: (req, res, next) => next(),
    handleValidationErrors: (req, res, next) => next(),
    validateClient: (req, res, next) => next(),
    validateConversation: (req, res, next) => next(),
    validateMessage: (req, res, next) => next(),
    validateFaqItem: (req, res, next) => next(),
    validateService: (req, res, next) => next(),
}));

const app = require("../../src/app");
const {
    Business,
    Client,
    Conversation,
    Lead,
    PlatformSource,
    Service,
    FaqItem,
} = require("../../src/models");

describe("Business Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/v1/businesses", () => {
        const validBusinessData = {
            company_name: "Test Business",
            description: "A test business",
            industry: "Technology",
            website: "https://testbusiness.com",
            owner_email: "test@testbusiness.com",
            phone: "+1234567890",
            address: "123 Test St",
            timezone: "UTC",
            planType: "basic",
            settings: { theme: "light" },
        };

        const mockCreatedBusiness = {
            businessId: "biz_12345678",
            name: "Test Business",
            industry: "Technology",
            planType: "basic",
            isActive: true,
            createdAt: new Date(),
        };

        beforeEach(() => {
            Business.create.mockResolvedValue(mockCreatedBusiness);
        });

        it("should create a business successfully", async () => {
            const response = await request(app)
                .post("/api/v1/businesses")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(validBusinessData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                businessId: "biz_12345678",
                name: "Test Business",
                industry: "Technology",
                planType: "basic",
                isActive: true,
            });
        });

        it("should return 400 for invalid business data", async () => {
            const invalidData = {
                company_name: "", // Invalid: empty name
                industry: "Technology",
            };

            const response = await request(app)
                .post("/api/v1/businesses")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(invalidData);

            expect(response.status).toBe(400);
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app)
                .post("/api/v1/businesses")
                .send(validBusinessData);

            expect(response.status).toBe(401);
        });

        it("should handle database errors", async () => {
            Business.create.mockRejectedValue(new Error("Database error"));

            const response = await request(app)
                .post("/api/v1/businesses")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(validBusinessData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Database error");
        });
    });

    describe("GET /api/v1/businesses", () => {
        const mockBusinesses = [
            {
                id: 1,
                businessId: "biz_12345678",
                name: "Test Business 1",
                industry: "Technology",
                planType: "basic",
                isActive: true,
                createdAt: new Date(),
                platformSources: [],
            },
            {
                id: 2,
                businessId: "biz_87654321",
                name: "Test Business 2",
                industry: "Healthcare",
                planType: "premium",
                isActive: true,
                createdAt: new Date(),
                platformSources: [],
            },
        ];

        beforeEach(() => {
            Business.findAndCountAll.mockResolvedValue({
                count: 2,
                rows: mockBusinesses,
            });
        });

        it("should get all businesses successfully", async () => {
            const response = await request(app)
                .get("/api/v1/businesses")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.businesses).toHaveLength(2);
            expect(response.body.data.pagination).toMatchObject({
                total: 2,
                page: 1,
                pages: 1,
                limit: 20,
            });
        });

        it("should handle pagination parameters", async () => {
            const response = await request(app)
                .get("/api/v1/businesses?page=2&limit=10")
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
                    "/api/v1/businesses?industry=Technology&planType=basic&isActive=true"
                )
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(Business.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        industry: "Technology",
                        planType: "basic",
                        isActive: true,
                    },
                })
            );
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app).get("/api/v1/businesses");

            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/v1/businesses/:businessId", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            name: "Test Business",
            industry: "Technology",
            planType: "basic",
            isActive: true,
            clients: [],
            platformSources: [],
            services: [],
            faqItems: [],
        };

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
        });

        it("should get a business successfully", async () => {
            const response = await request(app)
                .get("/api/v1/businesses/biz_12345678")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                businessId: "biz_12345678",
                name: "Test Business",
                industry: "Technology",
            });
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/v1/businesses/biz_nonexistent")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app).get(
                "/api/v1/businesses/biz_12345678"
            );

            expect(response.status).toBe(401);
        });
    });

    describe("PUT /api/v1/businesses/:businessId", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            name: "Test Business",
            industry: "Technology",
            update: jest.fn(),
        };

        const updateData = {
            company_name: "Updated Business",
            industry: "Healthcare",
        };

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
            mockBusiness.update.mockResolvedValue();
        });

        it("should update a business successfully", async () => {
            const response = await request(app)
                .put("/api/v1/businesses/biz_12345678")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockBusiness.update).toHaveBeenCalledWith(updateData);
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .put("/api/v1/businesses/biz_nonexistent")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app)
                .put("/api/v1/businesses/biz_12345678")
                .send(updateData);

            expect(response.status).toBe(401);
        });
    });

    describe("DELETE /api/v1/businesses/:businessId", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            name: "Test Business",
            destroy: jest.fn(),
        };

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
            mockBusiness.destroy.mockResolvedValue();
        });

        it("should delete a business successfully", async () => {
            const response = await request(app)
                .delete("/api/v1/businesses/biz_12345678")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Business deleted successfully");
            expect(mockBusiness.destroy).toHaveBeenCalled();
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .delete("/api/v1/businesses/biz_nonexistent")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });

        it("should return 401 without authentication", async () => {
            const response = await request(app).delete(
                "/api/v1/businesses/biz_12345678"
            );

            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/v1/businesses/:businessId/stats", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            name: "Test Business",
            industry: "Technology",
            planType: "basic",
        };

        const mockStats = {
            totalClients: 5,
            totalConversations: 8,
            totalLeads: 12,
            convertedLeads: 2,
            conversionRate: "16.67",
            conversationStates: [
                { status: "active", count: "5" },
                { status: "closed", count: "3" },
            ],
            leadStatuses: [
                { status: "new", count: "10" },
                { status: "won", count: "2" },
            ],
            platformStats: [
                { platform_type: "instagram", is_active: true, count: "1" },
            ],
        };

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
            Client.count.mockResolvedValue(5);
            Conversation.findAll.mockResolvedValue(
                mockStats.conversationStates
            );
            Lead.findAll.mockResolvedValue(mockStats.leadStatuses);
            PlatformSource.findAll.mockResolvedValue(mockStats.platformStats);
            Conversation.count.mockResolvedValue(8);
            Lead.count.mockResolvedValueOnce(12).mockResolvedValueOnce(2);
        });

        it("should get business stats successfully", async () => {
            const response = await request(app)
                .get("/api/v1/businesses/biz_12345678/stats")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                businessId: "biz_12345678",
                name: "Test Business",
                industry: "Technology",
                planType: "basic",
                totalClients: 5,
                totalConversations: 8,
                totalLeads: 12,
                convertedLeads: 2,
                conversionRate: "16.67",
            });
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/v1/businesses/biz_nonexistent/stats")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });
    });

    describe("GET /api/v1/businesses/:businessId/clients", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
        };

        const mockClients = [
            {
                id: 1,
                name: "Client 1",
                email: "client1@test.com",
                conversations: [],
            },
        ];

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
            Client.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockClients,
            });
        });

        it("should get business clients successfully", async () => {
            const response = await request(app)
                .get("/api/v1/businesses/biz_12345678/clients")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.clients).toHaveLength(1);
            expect(response.body.data.pagination).toMatchObject({
                total: 1,
                page: 1,
                pages: 1,
                limit: 20,
            });
        });

        it("should handle status filter", async () => {
            const response = await request(app)
                .get("/api/v1/businesses/biz_12345678/clients?status=active")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(Client.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { business_id: 1, status: "active" },
                })
            );
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/v1/businesses/biz_nonexistent/clients")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });
    });

    describe("GET /api/v1/businesses/:businessId/services", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
        };

        const mockServices = [
            {
                id: 1,
                name: "Service 1",
                description: "Test service",
                price: 100,
            },
        ];

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
            Service.findAll.mockResolvedValue(mockServices);
        });

        it("should get business services successfully", async () => {
            const response = await request(app)
                .get("/api/v1/businesses/biz_12345678/services")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]).toMatchObject({
                name: "Service 1",
                description: "Test service",
                price: 100,
            });
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/v1/businesses/biz_nonexistent/services")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });
    });

    describe("GET /api/v1/businesses/:businessId/faqs", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
        };

        const mockFaqs = [
            {
                id: 1,
                question: "What is your pricing?",
                answer: "Our pricing varies by plan.",
                category: "pricing",
                isActive: true,
            },
        ];

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
            FaqItem.findAll.mockResolvedValue(mockFaqs);
        });

        it("should get business FAQs successfully", async () => {
            const response = await request(app)
                .get("/api/v1/businesses/biz_12345678/faqs")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]).toMatchObject({
                question: "What is your pricing?",
                answer: "Our pricing varies by plan.",
                category: "pricing",
                isActive: true,
            });
        });

        it("should handle category and isActive filters", async () => {
            const response = await request(app)
                .get(
                    "/api/v1/businesses/biz_12345678/faqs?category=pricing&isActive=true"
                )
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(FaqItem.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        business_id: 1,
                        category: "pricing",
                        isActive: true,
                    },
                })
            );
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/v1/businesses/biz_nonexistent/faqs")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });
    });

    describe("PUT /api/v1/businesses/:businessId/settings", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            settings: { theme: "light", notifications: true },
            update: jest.fn(),
        };

        const settingsData = {
            settings: { theme: "dark", language: "en" },
        };

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
            mockBusiness.update.mockResolvedValue();
        });

        it("should update business settings successfully", async () => {
            const response = await request(app)
                .put("/api/v1/businesses/biz_12345678/settings")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(settingsData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                businessId: "biz_12345678",
                settings: {
                    theme: "dark",
                    notifications: true,
                    language: "en",
                },
            });
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .put("/api/v1/businesses/biz_nonexistent/settings")
                .set("Authorization", "Bearer valid_jwt_token")
                .send(settingsData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });
    });

    describe("PATCH /api/v1/businesses/:businessId/toggle-status", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            isActive: true,
            update: jest.fn(),
        };

        beforeEach(() => {
            Business.findOne.mockResolvedValue(mockBusiness);
            mockBusiness.update.mockResolvedValue();
        });

        it("should toggle business status successfully", async () => {
            const response = await request(app)
                .patch("/api/v1/businesses/biz_12345678/toggle-status")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                businessId: "biz_12345678",
                isActive: false,
                message: "Business deactivated successfully",
            });
            expect(mockBusiness.update).toHaveBeenCalledWith({
                isActive: false,
            });
        });

        it("should return 404 for non-existent business", async () => {
            Business.findOne.mockResolvedValue(null);

            const response = await request(app)
                .patch("/api/v1/businesses/biz_nonexistent/toggle-status")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Business not found");
        });
    });

    describe("Error Handling", () => {
        it("should handle malformed business IDs", async () => {
            const response = await request(app)
                .get("/api/v1/businesses/invalid-id")
                .set("Authorization", "Bearer valid_jwt_token");

            // The validation middleware might return 400 or the business lookup might return 404
            expect([400, 404]).toContain(response.status);
        });

        it("should handle database connection errors", async () => {
            Business.findOne.mockRejectedValue(
                new Error("Database connection failed")
            );

            const response = await request(app)
                .get("/api/v1/businesses/biz_12345678")
                .set("Authorization", "Bearer valid_jwt_token");

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Database connection failed");
        });
    });

    describe("CORS Configuration", () => {
        it("should allow CORS for business endpoints", async () => {
            const response = await request(app)
                .options("/api/v1/businesses")
                .set("Origin", "https://example.com")
                .set("Access-Control-Request-Method", "GET");

            // CORS headers might be set by the middleware
            expect(response.status).toBe(204);
        });
    });
});
