const BusinessController = require("../../src/controllers/BusinessController");
const {
    Business,
    Client,
    Conversation,
    Lead,
    PlatformSource,
    Service,
    FaqItem,
} = require("../../src/models");
const crypto = require("crypto");

// Mock the models
jest.mock("../../src/models", () => ({
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
}));

// Mock crypto
jest.mock("crypto", () => ({
    randomBytes: jest.fn(),
}));

describe("BusinessController", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe("createBusiness", () => {
        const mockBusinessData = {
            name: "Test Business",
            description: "A test business",
            industry: "Technology",
            website: "https://testbusiness.com",
            email: "test@testbusiness.com",
            phone: "+1234567890",
            address: "123 Test St",
            timezone: "UTC",
            planType: "basic",
            settings: { theme: "light" },
        };

        const mockCreatedBusiness = {
            businessId: "biz_12345678",
            name: "Test Business",
            description: "A test business",
            industry: "Technology",
            website: "https://testbusiness.com",
            email: "test@testbusiness.com",
            phone: "+1234567890",
            address: "123 Test St",
            timezone: "UTC",
            planType: "basic",
            settings: { theme: "light" },
            isActive: true,
            createdAt: new Date(),
        };

        beforeEach(() => {
            mockReq.body = mockBusinessData;
            crypto.randomBytes.mockReturnValue({
                toString: jest.fn().mockReturnValue("12345678"),
            });
            Business.create.mockResolvedValue(mockCreatedBusiness);
        });

        it("should create a business successfully", async () => {
            await BusinessController.createBusiness(mockReq, mockRes);

            expect(Business.create).toHaveBeenCalledWith({
                businessId: "biz_12345678",
                name: "Test Business",
                description: "A test business",
                industry: "Technology",
                website: "https://testbusiness.com",
                email: "test@testbusiness.com",
                phone: "+1234567890",
                address: "123 Test St",
                timezone: "UTC",
                planType: "basic",
                settings: { theme: "light" },
                isActive: true,
            });

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    businessId: "biz_12345678",
                    name: "Test Business",
                    industry: "Technology",
                    planType: "basic",
                    isActive: true,
                    createdAt: mockCreatedBusiness.createdAt,
                },
            });
        });

        it("should handle creation errors", async () => {
            Business.create.mockRejectedValue(new Error("Database error"));

            await BusinessController.createBusiness(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });

        it("should use default values when not provided", async () => {
            mockReq.body = {
                name: "Test Business",
                description: "A test business",
                industry: "Technology",
            };

            await BusinessController.createBusiness(mockReq, mockRes);

            expect(Business.create).toHaveBeenCalledWith({
                businessId: "biz_12345678",
                name: "Test Business",
                description: "A test business",
                industry: "Technology",
                website: undefined,
                email: undefined,
                phone: undefined,
                address: undefined,
                timezone: "UTC",
                planType: "basic",
                settings: {},
                isActive: true,
            });
        });
    });

    describe("getBusinesses", () => {
        const mockBusinesses = [
            {
                id: 1,
                businessId: "biz_12345678",
                name: "Test Business 1",
                industry: "Technology",
                planType: "basic",
                isActive: true,
                createdAt: new Date(),
            },
            {
                id: 2,
                businessId: "biz_87654321",
                name: "Test Business 2",
                industry: "Healthcare",
                planType: "premium",
                isActive: true,
                createdAt: new Date(),
            },
        ];

        const mockPlatformSources = [
            {
                id: 1,
                platform_type: "instagram",
                platform_name: "Test Instagram",
                is_active: true,
            },
        ];

        beforeEach(() => {
            Business.findAndCountAll.mockResolvedValue({
                count: 2,
                rows: mockBusinesses.map((business) => ({
                    ...business,
                    platformSources: mockPlatformSources,
                })),
            });
        });

        it("should get all businesses with default pagination", async () => {
            await BusinessController.getBusinesses(mockReq, mockRes);

            expect(Business.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                limit: 20,
                offset: 0,
                include: [
                    {
                        model: PlatformSource,
                        as: "platformSources",
                        attributes: [
                            "id",
                            "platform_type",
                            "platform_name",
                            "is_active",
                        ],
                    },
                ],
                order: [["createdAt", "DESC"]],
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    businesses: mockBusinesses.map((business) => ({
                        ...business,
                        platformSources: mockPlatformSources,
                    })),
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

            await BusinessController.getBusinesses(mockReq, mockRes);

            expect(Business.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                limit: 10,
                offset: 10,
                include: expect.any(Array),
                order: [["createdAt", "DESC"]],
            });
        });

        it("should handle filtering parameters", async () => {
            mockReq.query = {
                industry: "Technology",
                planType: "basic",
                isActive: "true",
            };

            await BusinessController.getBusinesses(mockReq, mockRes);

            expect(Business.findAndCountAll).toHaveBeenCalledWith({
                where: {
                    industry: "Technology",
                    planType: "basic",
                    isActive: true,
                },
                limit: 20,
                offset: 0,
                include: expect.any(Array),
                order: [["createdAt", "DESC"]],
            });
        });

        it("should handle errors", async () => {
            Business.findAndCountAll.mockRejectedValue(
                new Error("Database error")
            );

            await BusinessController.getBusinesses(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("getBusiness", () => {
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
            mockReq.params = { businessId: "biz_12345678" };
        });

        it("should get a business successfully", async () => {
            Business.findOne.mockResolvedValue(mockBusiness);

            await BusinessController.getBusiness(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
                include: [
                    {
                        model: Client,
                        as: "clients",
                        limit: 10,
                        order: [["createdAt", "DESC"]],
                    },
                    {
                        model: PlatformSource,
                        as: "platformSources",
                        attributes: [
                            "id",
                            "platform_type",
                            "platform_name",
                            "is_active",
                            "last_sync",
                        ],
                    },
                    {
                        model: Service,
                        as: "services",
                        limit: 10,
                        order: [["display_order", "ASC"]],
                    },
                    {
                        model: FaqItem,
                        as: "faqItems",
                        limit: 10,
                        order: [["createdAt", "DESC"]],
                    },
                ],
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockBusiness,
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.getBusiness(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });

        it("should handle errors", async () => {
            Business.findOne.mockRejectedValue(new Error("Database error"));

            await BusinessController.getBusiness(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("updateBusiness", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            name: "Test Business",
            industry: "Technology",
            update: jest.fn(),
        };

        beforeEach(() => {
            mockReq.params = { businessId: "biz_12345678" };
            mockReq.body = { name: "Updated Business", industry: "Healthcare" };
            Business.findOne.mockResolvedValue(mockBusiness);
            mockBusiness.update.mockResolvedValue();
        });

        it("should update a business successfully", async () => {
            await BusinessController.updateBusiness(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
            });
            expect(mockBusiness.update).toHaveBeenCalledWith({
                name: "Updated Business",
                industry: "Healthcare",
            });
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockBusiness,
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.updateBusiness(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });

        it("should handle update errors", async () => {
            mockBusiness.update.mockRejectedValue(new Error("Update error"));

            await BusinessController.updateBusiness(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Update error",
            });
        });
    });

    describe("deleteBusiness", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            name: "Test Business",
            destroy: jest.fn(),
        };

        beforeEach(() => {
            mockReq.params = { businessId: "biz_12345678" };
            Business.findOne.mockResolvedValue(mockBusiness);
            mockBusiness.destroy.mockResolvedValue();
        });

        it("should delete a business successfully", async () => {
            await BusinessController.deleteBusiness(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
            });
            expect(mockBusiness.destroy).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Business deleted successfully",
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.deleteBusiness(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });

        it("should handle delete errors", async () => {
            mockBusiness.destroy.mockRejectedValue(new Error("Delete error"));

            await BusinessController.deleteBusiness(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Delete error",
            });
        });
    });

    describe("getBusinessStats", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            name: "Test Business",
            industry: "Technology",
            planType: "basic",
        };

        const mockConversationStats = [
            { status: "active", count: "5" },
            { status: "closed", count: "3" },
        ];

        const mockLeadStats = [
            { status: "new", count: "10" },
            { status: "won", count: "2" },
        ];

        const mockPlatformStats = [
            { platform_type: "instagram", is_active: true, count: "1" },
        ];

        beforeEach(() => {
            mockReq.params = { businessId: "biz_12345678" };
            Business.findOne.mockResolvedValue(mockBusiness);
            Client.count.mockResolvedValue(5);
            Conversation.findAll.mockResolvedValue(mockConversationStats);
            Lead.findAll.mockResolvedValue(mockLeadStats);
            PlatformSource.findAll.mockResolvedValue(mockPlatformStats);
            Conversation.count.mockResolvedValue(8);
            Lead.count.mockResolvedValue(12);
            Lead.count.mockResolvedValueOnce(12).mockResolvedValueOnce(2); // For total and converted
        });

        it("should get business stats successfully", async () => {
            await BusinessController.getBusinessStats(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
            });
            expect(Client.count).toHaveBeenCalledWith({
                where: { business_id: 1 },
            });
            expect(Conversation.findAll).toHaveBeenCalled();
            expect(Lead.findAll).toHaveBeenCalled();
            expect(PlatformSource.findAll).toHaveBeenCalled();

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    businessId: "biz_12345678",
                    name: "Test Business",
                    industry: "Technology",
                    planType: "basic",
                    totalClients: 5,
                    totalConversations: 8,
                    totalLeads: 12,
                    convertedLeads: 2,
                    conversionRate: "16.67",
                    conversationStates: mockConversationStats,
                    leadStatuses: mockLeadStats,
                    platformStats: mockPlatformStats,
                },
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.getBusinessStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });

        it("should handle zero leads for conversion rate", async () => {
            // Reset the mock to return 0 for both lead counts
            Lead.count.mockReset();
            Lead.count.mockResolvedValue(0);

            await BusinessController.getBusinessStats(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        conversionRate: "0.00",
                    }),
                })
            );
        });

        it("should handle errors", async () => {
            Business.findOne.mockRejectedValue(new Error("Database error"));

            await BusinessController.getBusinessStats(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Database error",
            });
        });
    });

    describe("getBusinessClients", () => {
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
            mockReq.params = { businessId: "biz_12345678" };
            Business.findOne.mockResolvedValue(mockBusiness);
            Client.findAndCountAll.mockResolvedValue({
                count: 1,
                rows: mockClients,
            });
        });

        it("should get business clients successfully", async () => {
            await BusinessController.getBusinessClients(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
            });
            expect(Client.findAndCountAll).toHaveBeenCalledWith({
                where: { business_id: 1 },
                limit: 20,
                offset: 0,
                include: [
                    {
                        model: Conversation,
                        as: "conversations",
                        attributes: [
                            "id",
                            "status",
                            "message_count",
                            "last_message_at",
                        ],
                        limit: 1,
                        order: [["last_message_at", "DESC"]],
                    },
                ],
                order: [["createdAt", "DESC"]],
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    clients: mockClients,
                    pagination: {
                        total: 1,
                        page: 1,
                        pages: 1,
                        limit: 20,
                    },
                },
            });
        });

        it("should handle status filter", async () => {
            mockReq.query = { status: "active" };

            await BusinessController.getBusinessClients(mockReq, mockRes);

            expect(Client.findAndCountAll).toHaveBeenCalledWith({
                where: { business_id: 1, status: "active" },
                limit: 20,
                offset: 0,
                include: expect.any(Array),
                order: [["createdAt", "DESC"]],
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.getBusinessClients(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });
    });

    describe("getBusinessServices", () => {
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
            mockReq.params = { businessId: "biz_12345678" };
            Business.findOne.mockResolvedValue(mockBusiness);
            Service.findAll.mockResolvedValue(mockServices);
        });

        it("should get business services successfully", async () => {
            await BusinessController.getBusinessServices(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
            });
            expect(Service.findAll).toHaveBeenCalledWith({
                where: { business_id: 1 },
                order: [
                    ["display_order", "ASC"],
                    ["name", "ASC"],
                ],
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockServices,
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.getBusinessServices(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });
    });

    describe("getBusinessFaqs", () => {
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
            mockReq.params = { businessId: "biz_12345678" };
            Business.findOne.mockResolvedValue(mockBusiness);
            FaqItem.findAll.mockResolvedValue(mockFaqs);
        });

        it("should get business FAQs successfully", async () => {
            await BusinessController.getBusinessFaqs(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
            });
            expect(FaqItem.findAll).toHaveBeenCalledWith({
                where: { business_id: 1 },
                order: [
                    ["display_order", "ASC"],
                    ["question", "ASC"],
                ],
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockFaqs,
            });
        });

        it("should handle category and isActive filters", async () => {
            mockReq.query = { category: "pricing", isActive: "true" };

            await BusinessController.getBusinessFaqs(mockReq, mockRes);

            expect(FaqItem.findAll).toHaveBeenCalledWith({
                where: { business_id: 1, category: "pricing", isActive: true },
                order: [
                    ["display_order", "ASC"],
                    ["question", "ASC"],
                ],
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.getBusinessFaqs(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });
    });

    describe("updateBusinessSettings", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            settings: { theme: "light", notifications: true },
            update: jest.fn(),
        };

        beforeEach(() => {
            mockReq.params = { businessId: "biz_12345678" };
            mockReq.body = { settings: { theme: "dark", language: "en" } };
            Business.findOne.mockResolvedValue(mockBusiness);
            mockBusiness.update.mockResolvedValue();
        });

        it("should update business settings successfully", async () => {
            await BusinessController.updateBusinessSettings(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
            });
            expect(mockBusiness.update).toHaveBeenCalledWith({
                settings: {
                    theme: "dark",
                    notifications: true,
                    language: "en",
                },
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    businessId: "biz_12345678",
                    settings: {
                        theme: "dark",
                        notifications: true,
                        language: "en",
                    },
                },
            });
        });

        it("should handle empty existing settings", async () => {
            mockBusiness.settings = null;

            await BusinessController.updateBusinessSettings(mockReq, mockRes);

            expect(mockBusiness.update).toHaveBeenCalledWith({
                settings: { theme: "dark", language: "en" },
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.updateBusinessSettings(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });
    });

    describe("toggleBusinessStatus", () => {
        const mockBusiness = {
            id: 1,
            businessId: "biz_12345678",
            isActive: true,
            update: jest.fn(),
        };

        beforeEach(() => {
            mockReq.params = { businessId: "biz_12345678" };
            Business.findOne.mockResolvedValue(mockBusiness);
            mockBusiness.update.mockResolvedValue();
        });

        it("should toggle business status from active to inactive", async () => {
            await BusinessController.toggleBusinessStatus(mockReq, mockRes);

            expect(Business.findOne).toHaveBeenCalledWith({
                where: { businessId: "biz_12345678" },
            });
            expect(mockBusiness.update).toHaveBeenCalledWith({
                isActive: false,
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    businessId: "biz_12345678",
                    isActive: false,
                    message: "Business deactivated successfully",
                },
            });
        });

        it("should toggle business status from inactive to active", async () => {
            mockBusiness.isActive = false;

            await BusinessController.toggleBusinessStatus(mockReq, mockRes);

            expect(mockBusiness.update).toHaveBeenCalledWith({
                isActive: true,
            });

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    businessId: "biz_12345678",
                    isActive: true,
                    message: "Business activated successfully",
                },
            });
        });

        it("should return 404 if business not found", async () => {
            Business.findOne.mockResolvedValue(null);

            await BusinessController.toggleBusinessStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Business not found",
            });
        });

        it("should handle errors", async () => {
            mockBusiness.update.mockRejectedValue(new Error("Update error"));

            await BusinessController.toggleBusinessStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: "Update error",
            });
        });
    });
});
