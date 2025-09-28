"use strict";

const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const {
    Business,
    BusinessContextSection,
    FaqItem,
    FaqKeyword,
    UnansweredQuestion,
    User,
} = require("../models");
const {
    verifyFirebaseToken,
    requireRoles,
} = require("../middleware/firebaseAuth");

/**
 * @swagger
 * tags:
 *   name: Business Settings
 *   description: Business settings management endpoints
 */

/**
 * @swagger
 * /api/business/info:
 *   get:
 *     summary: Get business information
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BusinessInfo'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Business not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/info", verifyFirebaseToken, async (req, res) => {
    try {
        // Get user's business (assuming user owns one business for now)
        const business = await Business.findOne({
            where: { owner_id: req.user.id },
            attributes: [
                "id",
                "company_name",
                "business_type",
                "owner_name",
                "owner_email",
                "phone",
                "website",
                "primary_language",
                "auto_detect_language",
                "timezone",
                "subscription_plan",
                "subscription_status",
                "onboarding_completed",
                "setup_step",
                "created_at",
                "updated_at",
            ],
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        res.json({
            success: true,
            data: business,
        });
    } catch (error) {
        console.error("Get business info error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/info:
 *   put:
 *     summary: Update business information
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessInfo'
 *     responses:
 *       200:
 *         description: Business information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BusinessInfo'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Business not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/info", verifyFirebaseToken, async (req, res) => {
    try {
        const {
            company_name,
            business_type,
            owner_name,
            email,
            phone,
            website,
            address,
            city,
            state,
            country,
            postal_code,
            primary_language,
            auto_detect_language,
            timezone,
        } = req.body;

        // Validate required fields
        if (!company_name || !business_type) {
            return res.status(400).json({
                success: false,
                error: "Company name and business type are required",
                code: "VALIDATION_ERROR",
            });
        }

        const business = await Business.findOne({
            where: { owner_id: req.user.id },
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        // Update business
        await business.update({
            company_name,
            business_type,
            owner_name,
            email,
            phone,
            website,
            address,
            city,
            state,
            country,
            postal_code,
            primary_language,
            auto_detect_language,
            timezone,
        });

        res.json({
            success: true,
            data: business,
        });
    } catch (error) {
        console.error("Update business info error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/context:
 *   get:
 *     summary: Get business context data
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business context retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BusinessContextSection'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/context", verifyFirebaseToken, async (req, res) => {
    try {
        const business = await Business.findOne({
            where: { owner_id: req.user.id },
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        const contextSections = await BusinessContextSection.findAll({
            where: { business_id: business.id },
            order: [["section_type", "ASC"], ["display_order", "ASC"]],
        });

        res.json({
            success: true,
            data: contextSections,
        });
    } catch (error) {
        console.error("Get business context error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/context:
 *   put:
 *     summary: Update business context
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sections:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BusinessContextSection'
 *     responses:
 *       200:
 *         description: Business context updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BusinessContextSection'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/context", verifyFirebaseToken, async (req, res) => {
    try {
        const { sections } = req.body;

        if (!Array.isArray(sections)) {
            return res.status(400).json({
                success: false,
                error: "Sections must be an array",
                code: "VALIDATION_ERROR",
            });
        }

        const business = await Business.findOne({
            where: { owner_id: req.user.id },
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        // Delete existing sections
        await BusinessContextSection.destroy({
            where: { business_id: business.id },
        });

        // Create new sections
        const newSections = await Promise.all(
            sections.map((section) =>
                BusinessContextSection.create({
                    business_id: business.id,
                    ...section,
                })
            )
        );

        res.json({
            success: true,
            data: newSections,
        });
    } catch (error) {
        console.error("Update business context error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/hours:
 *   get:
 *     summary: Get business hours
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business hours retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day:
 *                         type: string
 *                         enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                       open_time:
 *                         type: string
 *                         format: time
 *                       close_time:
 *                         type: string
 *                         format: time
 *                       is_closed:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/hours", verifyFirebaseToken, async (req, res) => {
    try {
        const business = await Business.findOne({
            where: { owner_id: req.user.id },
            attributes: ["business_hours"],
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        // Default business hours if none set
        const defaultHours = [
            { day: "monday", open_time: "09:00", close_time: "17:00", is_closed: false },
            { day: "tuesday", open_time: "09:00", close_time: "17:00", is_closed: false },
            { day: "wednesday", open_time: "09:00", close_time: "17:00", is_closed: false },
            { day: "thursday", open_time: "09:00", close_time: "17:00", is_closed: false },
            { day: "friday", open_time: "09:00", close_time: "17:00", is_closed: false },
            { day: "saturday", open_time: "10:00", close_time: "14:00", is_closed: false },
            { day: "sunday", open_time: null, close_time: null, is_closed: true },
        ];

        const businessHours = business.business_hours || defaultHours;

        res.json({
            success: true,
            data: businessHours,
        });
    } catch (error) {
        console.error("Get business hours error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/hours:
 *   put:
 *     summary: Update business hours
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                     open_time:
 *                       type: string
 *                       format: time
 *                     close_time:
 *                       type: string
 *                       format: time
 *                     is_closed:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Business hours updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/hours", verifyFirebaseToken, async (req, res) => {
    try {
        const { hours } = req.body;

        if (!Array.isArray(hours)) {
            return res.status(400).json({
                success: false,
                error: "Hours must be an array",
                code: "VALIDATION_ERROR",
            });
        }

        const business = await Business.findOne({
            where: { owner_id: req.user.id },
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        for (const hour of hours) {
            if (!hour.is_closed && hour.open_time && !timeRegex.test(hour.open_time)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid time format for ${hour.day} open_time`,
                    code: "VALIDATION_ERROR",
                });
            }
            if (!hour.is_closed && hour.close_time && !timeRegex.test(hour.close_time)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid time format for ${hour.day} close_time`,
                    code: "VALIDATION_ERROR",
                });
            }
        }

        await business.update({ business_hours: hours });

        res.json({
            success: true,
            data: hours,
        });
    } catch (error) {
        console.error("Update business hours error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

module.exports = router;
