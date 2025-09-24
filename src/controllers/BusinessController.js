// =====================================
// BUSINESS CONTROLLER
// =====================================

const {
    Business,
    Client,
    Conversation,
    Lead,
    PlatformSource,
    Service,
    FaqItem,
} = require("../models");
const crypto = require("crypto");

class BusinessController {
    static async createBusiness(req, res) {
        try {
            const {
                name,
                description,
                industry,
                website,
                email,
                phone,
                address,
                timezone = "UTC",
                planType = "basic",
                settings = {},
            } = req.body;

            // Generate unique business ID
            const businessId = "biz_" + crypto.randomBytes(8).toString("hex");

            const business = await Business.create({
                businessId,
                name,
                description,
                industry,
                website,
                email,
                phone,
                address,
                timezone,
                planType,
                settings,
                isActive: true,
            });

            res.status(201).json({
                success: true,
                data: {
                    businessId: business.businessId,
                    name: business.name,
                    industry: business.industry,
                    planType: business.planType,
                    isActive: business.isActive,
                    createdAt: business.createdAt,
                },
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getBusinesses(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                industry,
                planType,
                isActive,
            } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (industry) where.industry = industry;
            if (planType) where.planType = planType;
            if (isActive !== undefined) where.isActive = isActive === "true";

            const { count, rows } = await Business.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
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

            res.json({
                success: true,
                data: {
                    businesses: rows,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        pages: Math.ceil(count / limit),
                        limit: parseInt(limit),
                    },
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getBusiness(req, res) {
        try {
            const { businessId } = req.params;

            const business = await Business.findOne({
                where: { businessId },
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

            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            res.json({
                success: true,
                data: business,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async updateBusiness(req, res) {
        try {
            const { businessId } = req.params;
            const updates = req.body;

            const business = await Business.findOne({ where: { businessId } });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            await business.update(updates);

            res.json({
                success: true,
                data: business,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async deleteBusiness(req, res) {
        try {
            const { businessId } = req.params;

            const business = await Business.findOne({ where: { businessId } });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            await business.destroy();

            res.json({
                success: true,
                message: "Business deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getBusinessStats(req, res) {
        try {
            const { businessId } = req.params;

            // Get business
            const business = await Business.findOne({ where: { businessId } });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            // Get client stats
            const totalClients = await Client.count({
                where: { business_id: business.id },
            });

            // Get conversation stats
            const conversationStats = await Conversation.findAll({
                where: { business_id: business.id },
                attributes: [
                    "status",
                    [Conversation.sequelize.fn("COUNT", "*"), "count"],
                ],
                group: ["status"],
                raw: true,
            });

            // Get lead stats
            const leadStats = await Lead.findAll({
                where: { business_id: business.id },
                attributes: [
                    "status",
                    [Lead.sequelize.fn("COUNT", "*"), "count"],
                ],
                group: ["status"],
                raw: true,
            });

            // Get total counts
            const totalConversations = await Conversation.count({
                where: { business_id: business.id },
            });
            const totalLeads = await Lead.count({
                where: { business_id: business.id },
            });
            const convertedLeads = await Lead.count({
                where: { business_id: business.id, status: "won" },
            });

            // Get platform source stats
            const platformStats = await PlatformSource.findAll({
                where: { business_id: business.id },
                attributes: [
                    "platform_type",
                    "is_active",
                    [PlatformSource.sequelize.fn("COUNT", "*"), "count"],
                ],
                group: ["platform_type", "is_active"],
                raw: true,
            });

            res.json({
                success: true,
                data: {
                    businessId: business.businessId,
                    name: business.name,
                    industry: business.industry,
                    planType: business.planType,
                    totalClients,
                    totalConversations,
                    totalLeads,
                    convertedLeads,
                    conversionRate:
                        totalLeads > 0
                            ? ((convertedLeads / totalLeads) * 100).toFixed(2)
                            : "0.00",
                    conversationStates: conversationStats,
                    leadStatuses: leadStats,
                    platformStats,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getBusinessClients(req, res) {
        try {
            const { businessId } = req.params;
            const { page = 1, limit = 20, status } = req.query;
            const offset = (page - 1) * limit;

            const business = await Business.findOne({ where: { businessId } });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            const where = { business_id: business.id };
            if (status) where.status = status;

            const { count, rows } = await Client.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
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

            res.json({
                success: true,
                data: {
                    clients: rows,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        pages: Math.ceil(count / limit),
                        limit: parseInt(limit),
                    },
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getBusinessServices(req, res) {
        try {
            const { businessId } = req.params;

            const business = await Business.findOne({ where: { businessId } });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            const services = await Service.findAll({
                where: { business_id: business.id },
                order: [
                    ["display_order", "ASC"],
                    ["name", "ASC"],
                ],
            });

            res.json({
                success: true,
                data: services,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getBusinessFaqs(req, res) {
        try {
            const { businessId } = req.params;
            const { category, isActive } = req.query;

            const business = await Business.findOne({ where: { businessId } });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            const where = { business_id: business.id };
            if (category) where.category = category;
            if (isActive !== undefined) where.isActive = isActive === "true";

            const faqItems = await FaqItem.findAll({
                where,
                order: [
                    ["display_order", "ASC"],
                    ["question", "ASC"],
                ],
            });

            res.json({
                success: true,
                data: faqItems,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async updateBusinessSettings(req, res) {
        try {
            const { businessId } = req.params;
            const { settings } = req.body;

            const business = await Business.findOne({ where: { businessId } });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            const currentSettings = business.settings || {};
            const updatedSettings = { ...currentSettings, ...settings };

            await business.update({ settings: updatedSettings });

            res.json({
                success: true,
                data: {
                    businessId: business.businessId,
                    settings: updatedSettings,
                },
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async toggleBusinessStatus(req, res) {
        try {
            const { businessId } = req.params;

            const business = await Business.findOne({ where: { businessId } });
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            const newStatus = !business.isActive;
            await business.update({ isActive: newStatus });

            res.json({
                success: true,
                data: {
                    businessId: business.businessId,
                    isActive: newStatus,
                    message: `Business ${
                        newStatus ? "activated" : "deactivated"
                    } successfully`,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
}

module.exports = BusinessController;
