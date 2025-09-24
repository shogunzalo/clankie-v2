const { Conversation, Message, Lead, Client, Activity } = require("../models");
const { Op } = require("sequelize");
const axios = require("axios");

class ConversationController {
    static async getConversations(req, res) {
        try {
            const { page = 1, limit = 20, state, isActive, search } = req.query;

            const offset = (page - 1) * limit;
            const where = {};

            // IMPORTANT: Use authenticated clientId instead of query parameter
            // This ensures users only see their own conversations
            where.clientId = req.clientId; // This comes from the authenticate middleware

            if (state) where.currentState = state;
            if (isActive !== undefined) where.isActive = isActive === "true";

            if (search) {
                where[Op.or] = [
                    { userName: { [Op.iLike]: `%${search}%` } },
                    { instagramUsername: { [Op.iLike]: `%${search}%` } },
                ];
            }

            console.log(
                "🔍 Fetching conversations for authenticated clientId:",
                req.clientId
            );
            console.log("📋 Query filters:", where);

            const { count, rows } = await Conversation.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset,
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

            console.log(
                `✅ Found ${count} conversations for clientId: ${req.clientId}`
            );

            res.json({
                success: true,
                data: {
                    conversations: rows,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        pages: Math.ceil(count / limit),
                        limit: parseInt(limit),
                    },
                },
            });
        } catch (error) {
            console.error("❌ Error fetching conversations:", error);
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getConversation(req, res) {
        try {
            const { id } = req.params;

            const conversation = await Conversation.findByPk(id, {
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

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found",
                });
            }

            res.json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async updateState(req, res) {
        try {
            const { id } = req.params;
            const { state } = req.body;

            const conversation = await Conversation.findByPk(id);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found",
                });
            }

            const oldState = conversation.currentState;
            await conversation.updateState(state);

            // Log activity
            await Activity.logActivity({
                clientId: conversation.clientId,
                conversationId: conversation.id,
                type: "state_change",
                title: "Conversation state updated",
                description: `State changed from ${oldState} to ${state}`,
                data: { oldState, newState: state },
                performedBy: "user", // or get from auth context
            });

            res.json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getMessages(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            const messages = await Message.findAll({
                where: { conversationId: id },
                limit: parseInt(limit),
                offset,
                order: [["timestamp", "DESC"]],
            });

            res.json({
                success: true,
                data: messages.reverse(), // Return in chronological order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async sendMessage(req, res) {
        try {
            const { id } = req.params;
            const { message, senderType = "agent" } = req.body;

            const conversation = await Conversation.findByPk(id, {
                include: [
                    {
                        model: Client,
                        as: "client",
                        include: [
                            {
                                model: require("../models").InstagramConnection,
                                as: "instagramConnection",
                            },
                        ],
                    },
                ],
            });

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found",
                });
            }

            // Send message via Instagram API
            const connection = conversation.client.instagramConnection;
            if (connection && connection.status === "active") {
                try {
                    await axios.post(
                        "https://graph.facebook.com/v18.0/me/messages",
                        {
                            recipient: { id: conversation.userId },
                            message: { text: message },
                        },
                        {
                            params: { access_token: connection.accessToken },
                        }
                    );
                } catch (apiError) {
                    console.error(
                        "Failed to send Instagram message:",
                        apiError.response?.data
                    );
                    return res.status(500).json({
                        success: false,
                        error: "Failed to send message via Instagram",
                    });
                }
            }

            // Save message to database
            const newMessage = await Message.create({
                conversationId: id,
                clientId: conversation.clientId,
                senderType,
                messageText: message,
                timestamp: new Date(),
                isAutomated: senderType === "bot",
            });

            // Update conversation
            await conversation.incrementMessageCount();

            res.json({
                success: true,
                data: newMessage,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async createConversation(req, res) {
        try {
            const {
                userId,
                userName,
                instagramUsername,
                platformSourceId,
                currentState = "initial_contact",
            } = req.body;

            const conversation = await Conversation.create({
                clientId: req.clientId,
                userId,
                userName,
                instagramUsername,
                platformSourceId,
                currentState,
                isActive: true,
                messageCount: 0,
                lastMessageAt: new Date(),
            });

            res.status(201).json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async updateConversation(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const conversation = await Conversation.findByPk(id);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found",
                });
            }

            await conversation.update(updates);

            res.json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async deleteConversation(req, res) {
        try {
            const { id } = req.params;

            const conversation = await Conversation.findByPk(id);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found",
                });
            }

            await conversation.destroy();

            res.json({
                success: true,
                message: "Conversation deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async getConversationStats(req, res) {
        try {
            const { id } = req.params;

            const conversation = await Conversation.findByPk(id);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: "Conversation not found",
                });
            }

            // Get message stats
            const totalMessages = await Message.count({
                where: { conversationId: id },
            });

            const messageStats = await Message.findAll({
                where: { conversationId: id },
                attributes: [
                    "senderType",
                    [Message.sequelize.fn("COUNT", "*"), "count"],
                ],
                group: ["senderType"],
                raw: true,
            });

            // Get lead stats if conversation has a lead
            let leadStats = null;
            if (conversation.leadId) {
                const lead = await Lead.findByPk(conversation.leadId);
                if (lead) {
                    leadStats = {
                        status: lead.status,
                        leadScore: lead.leadScore,
                        createdAt: lead.createdAt,
                        lastInteractionAt: lead.lastInteractionAt,
                    };
                }
            }

            res.json({
                success: true,
                data: {
                    conversationId: id,
                    currentState: conversation.currentState,
                    isActive: conversation.isActive,
                    messageCount: conversation.messageCount,
                    totalMessages,
                    messageStats,
                    leadStats,
                    createdAt: conversation.createdAt,
                    lastMessageAt: conversation.lastMessageAt,
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

module.exports = ConversationController;
