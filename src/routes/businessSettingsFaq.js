"use strict";

const express = require("express");
const router = express.Router();
const { FaqItem, FaqKeyword, Business } = require("../models");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");

/**
 * @swagger
 * /api/business/faqs:
 *   get:
 *     summary: Get all FAQs
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
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
 *                     $ref: '#/components/schemas/FaqItem'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", verifyFirebaseToken, async (req, res) => {
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

        const faqs = await FaqItem.findAll({
            where: { business_id: business.id },
            include: [
                {
                    model: FaqKeyword,
                    as: "keywords",
                    attributes: ["id", "keyword", "weight"],
                },
            ],
            order: [["category", "ASC"], ["created_at", "ASC"]],
        });

        res.json({
            success: true,
            data: faqs,
        });
    } catch (error) {
        console.error("Get FAQs error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/faqs:
 *   post:
 *     summary: Create new FAQ
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               answer:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               category:
 *                 type: string
 *                 default: general
 *               language_code:
 *                 type: string
 *                 default: en
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     keyword:
 *                       type: string
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *     responses:
 *       201:
 *         description: FAQ created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FaqItem'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", verifyFirebaseToken, async (req, res) => {
    try {
        const { question, answer, category = "general", language_code = "en", keywords = [] } = req.body;

        // Validate required fields
        if (!question || question.length < 10 || question.length > 500) {
            return res.status(400).json({
                success: false,
                error: "Question must be between 10 and 500 characters",
                code: "VALIDATION_ERROR",
            });
        }

        if (!answer || answer.length < 10 || answer.length > 2000) {
            return res.status(400).json({
                success: false,
                error: "Answer must be between 10 and 2000 characters",
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

        // Create FAQ
        const faq = await FaqItem.create({
            business_id: business.id,
            question: question.trim(),
            answer: answer.trim(),
            category,
            language_code,
            is_active: true,
            usage_count: 0,
            success_rate: null,
        });

        // Create keywords if provided
        if (keywords.length > 0) {
            await Promise.all(
                keywords.map((keyword) =>
                    FaqKeyword.create({
                        faq_id: faq.id,
                        keyword: keyword.keyword.toLowerCase().trim(),
                        weight: keyword.weight || 1.0,
                    })
                )
            );
        }

        // Reload FAQ with keywords
        const createdFaq = await FaqItem.findByPk(faq.id, {
            include: [
                {
                    model: FaqKeyword,
                    as: "keywords",
                    attributes: ["id", "keyword", "weight"],
                },
            ],
        });

        res.status(201).json({
            success: true,
            data: createdFaq,
        });
    } catch (error) {
        console.error("Create FAQ error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/faqs/{id}:
 *   put:
 *     summary: Update existing FAQ
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: FAQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               answer:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               category:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     keyword:
 *                       type: string
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FaqItem'
 *       404:
 *         description: FAQ not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer, category, is_active, keywords } = req.body;

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

        const faq = await FaqItem.findOne({
            where: { id, business_id: business.id },
        });

        if (!faq) {
            return res.status(404).json({
                success: false,
                error: "FAQ not found",
                code: "FAQ_NOT_FOUND",
            });
        }

        // Update FAQ
        const updateData = {};
        if (question) {
            if (question.length < 10 || question.length > 500) {
                return res.status(400).json({
                    success: false,
                    error: "Question must be between 10 and 500 characters",
                    code: "VALIDATION_ERROR",
                });
            }
            updateData.question = question.trim();
        }
        if (answer) {
            if (answer.length < 10 || answer.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: "Answer must be between 10 and 2000 characters",
                    code: "VALIDATION_ERROR",
                });
            }
            updateData.answer = answer.trim();
        }
        if (category) updateData.category = category;
        if (is_active !== undefined) updateData.is_active = is_active;

        await faq.update(updateData);

        // Update keywords if provided
        if (keywords && Array.isArray(keywords)) {
            // Delete existing keywords
            await FaqKeyword.destroy({ where: { faq_id: id } });
            
            // Create new keywords
            if (keywords.length > 0) {
                await Promise.all(
                    keywords.map((keyword) =>
                        FaqKeyword.create({
                            faq_id: id,
                            keyword: keyword.keyword.toLowerCase().trim(),
                            weight: keyword.weight || 1.0,
                        })
                    )
                );
            }
        }

        // Reload FAQ with keywords
        const updatedFaq = await FaqItem.findByPk(id, {
            include: [
                {
                    model: FaqKeyword,
                    as: "keywords",
                    attributes: ["id", "keyword", "weight"],
                },
            ],
        });

        res.json({
            success: true,
            data: updatedFaq,
        });
    } catch (error) {
        console.error("Update FAQ error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/faqs/{id}:
 *   delete:
 *     summary: Delete FAQ
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: FAQ ID
 *     responses:
 *       200:
 *         description: FAQ deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: FAQ not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;

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

        const faq = await FaqItem.findOne({
            where: { id, business_id: business.id },
        });

        if (!faq) {
            return res.status(404).json({
                success: false,
                error: "FAQ not found",
                code: "FAQ_NOT_FOUND",
            });
        }

        // Delete associated keywords first
        await FaqKeyword.destroy({ where: { faq_id: id } });
        
        // Delete FAQ
        await faq.destroy();

        res.json({
            success: true,
            message: "FAQ deleted successfully",
        });
    } catch (error) {
        console.error("Delete FAQ error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

module.exports = router;
