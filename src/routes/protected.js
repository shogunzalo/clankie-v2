"use strict";

const express = require("express");
const router = express.Router();
const {
    verifyFirebaseToken,
    requireRoles,
} = require("../middleware/firebaseAuth");
const { Business, Client, Conversation, Message } = require("../models");

/**
 * @swagger
 * /protected/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     description: Returns dashboard data for the authenticated user
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total_businesses:
 *                           type: integer
 *                         total_clients:
 *                           type: integer
 *                         total_conversations:
 *                           type: integer
 *                         total_messages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/dashboard", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;

        // Get user's businesses
        const businesses = await Business.findAll({
            where: { owner_id: user.id },
            attributes: [
                "id",
                "company_name",
                "business_type",
                "subscription_plan",
                "is_active",
            ],
        });

        // Get total counts
        const totalClients = await Client.count({
            include: [
                {
                    model: Business,
                    where: { owner_id: user.id },
                    attributes: [],
                },
            ],
        });

        const totalConversations = await Conversation.count({
            include: [
                {
                    model: Business,
                    where: { owner_id: user.id },
                    attributes: [],
                },
            ],
        });

        const totalMessages = await Message.count({
            include: [
                {
                    model: Conversation,
                    include: [
                        {
                            model: Business,
                            where: { owner_id: user.id },
                            attributes: [],
                        },
                    ],
                },
            ],
        });

        const dashboardData = {
            user: {
                id: user.id,
                email: user.email,
                display_name: user.display_name,
                photo_url: user.photo_url,
                roles: user.roles,
            },
            businesses,
            stats: {
                total_businesses: businesses.length,
                total_clients: totalClients,
                total_conversations: totalConversations,
                total_messages: totalMessages,
            },
        };

        res.json({
            success: true,
            dashboard: dashboardData,
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get dashboard data",
        });
    }
});

/**
 * @swagger
 * /protected/orders:
 *   get:
 *     summary: Get user orders (example protected endpoint)
 *     description: Returns orders for the authenticated user
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user_id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/orders", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;

        // Mock orders data - in a real app, this would come from a database
        const mockOrders = [
            {
                id: "order_123",
                user_id: user.id,
                amount: 99.99,
                status: "completed",
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            },
            {
                id: "order_456",
                user_id: user.id,
                amount: 199.99,
                status: "pending",
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            },
        ];

        res.json({
            success: true,
            orders: mockOrders,
        });
    } catch (error) {
        console.error("Orders error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get orders",
        });
    }
});

/**
 * @swagger
 * /protected/admin-only:
 *   get:
 *     summary: Admin only endpoint
 *     description: Example endpoint that requires admin role
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 admin_data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    "/admin-only",
    verifyFirebaseToken,
    requireRoles("admin"),
    async (req, res) => {
        try {
            const user = req.user;

            // Mock admin data
            const adminData = {
                system_stats: {
                    total_users: 150,
                    total_businesses: 45,
                    total_revenue: 125000,
                    active_sessions: 23,
                },
                recent_activities: [
                    {
                        action: "user_created",
                        user_id: 123,
                        timestamp: new Date(),
                    },
                    {
                        action: "business_updated",
                        business_id: 456,
                        timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    },
                ],
            };

            res.json({
                success: true,
                message: `Welcome, admin ${user.display_name}!`,
                admin_data: adminData,
            });
        } catch (error) {
            console.error("Admin endpoint error:", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to get admin data",
            });
        }
    }
);

/**
 * @swagger
 * /protected/business-owner-only:
 *   get:
 *     summary: Business owner only endpoint
 *     description: Example endpoint that requires business_owner role
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business owner data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 business_data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Business owner role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    "/business-owner-only",
    verifyFirebaseToken,
    requireRoles("business_owner"),
    async (req, res) => {
        try {
            const user = req.user;

            // Get user's businesses
            const businesses = await Business.findAll({
                where: { owner_id: user.id },
                attributes: [
                    "id",
                    "company_name",
                    "business_type",
                    "subscription_plan",
                ],
            });

            const businessData = {
                user_businesses: businesses,
                business_stats: {
                    total_revenue: 45000,
                    active_campaigns: 8,
                    customer_satisfaction: 4.8,
                },
            };

            res.json({
                success: true,
                message: `Welcome, business owner ${user.display_name}!`,
                business_data: businessData,
            });
        } catch (error) {
            console.error("Business owner endpoint error:", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to get business owner data",
            });
        }
    }
);

module.exports = router;
