"use strict";

const express = require("express");
const router = express.Router();
const { Business, BusinessContextSection } = require("../models");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");
const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("business-contexts");

/**
 * @swagger
 * /api/v1/businesses/{businessId}/contexts:
 *   get:
 *     summary: Get all custom context sections
 *     tags: [Business Contexts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code
 *       - in: query
 *         name: section_type
 *         schema:
 *           type: string
 *         description: Filter by section type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Custom context sections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContextSection'
 *       404:
 *         description: Business not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:businessId/contexts", verifyFirebaseToken, async (req, res) => {
    try {
        console.log(
            "GET contexts endpoint called for business:",
            req.params.businessId
        );
        const { businessId } = req.params;
        const { lang = "en", section_type, is_active } = req.query;

        logger.info("Getting custom context sections", {
            businessId,
            userId: req.user.id,
            language: lang,
            sectionType: section_type,
            isActive: is_active,
        });

        // Verify business ownership
        const business = await Business.findOne({
            where: { id: businessId, owner_id: req.user.id },
        });

        if (!business) {
            logger.warn("Business not found or access denied", {
                businessId,
                userId: req.user.id,
            });
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        // Build where clause
        const whereClause = {
            business_id: businessId,
            language_code: lang,
        };

        if (section_type) {
            whereClause.section_type = section_type;
        }

        // Handle is_active filter - default to true if not specified
        if (is_active !== undefined) {
            whereClause.is_active = is_active === "true" || is_active === true;
        } else {
            whereClause.is_active = true; // Default to true
        }

        // Get custom context sections
        const sections = await BusinessContextSection.findAll({
            where: whereClause,
            order: [
                ["section_type", "ASC"],
                ["display_order", "ASC"],
            ],
        });

        logger.info("Custom context sections retrieved successfully", {
            businessId,
            userId: req.user.id,
            sectionCount: sections.length,
            language: lang,
        });

        res.json({
            success: true,
            data: sections,
        });
    } catch (error) {
        logger.error("Get custom context sections error", {
            error: error.message,
            stack: error.stack,
            businessId: req.params.businessId,
            userId: req.user?.id,
        });
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/v1/businesses/{businessId}/contexts:
 *   post:
 *     summary: Create new custom context section
 *     tags: [Business Contexts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - section_name
 *               - content
 *               - section_type
 *               - language_code
 *             properties:
 *               section_name:
 *                 type: string
 *                 description: Name of the custom section
 *               content:
 *                 type: string
 *                 description: Section content
 *               section_type:
 *                 type: string
 *                 default: custom
 *                 description: Type of section
 *               language_code:
 *                 type: string
 *                 default: en
 *                 description: Language code
 *               display_order:
 *                 type: integer
 *                 default: 0
 *                 description: Display order
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether section is active
 *     responses:
 *       201:
 *         description: Custom context section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContextSection'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:businessId/contexts", verifyFirebaseToken, async (req, res) => {
    try {
        logger.info("POST /:businessId/contexts endpoint called", {
            businessId: req.params.businessId,
            userId: req.user?.id,
            method: req.method,
            url: req.url,
        });

        const { businessId } = req.params;
        const {
            section_name,
            content,
            section_type = "custom",
            language_code = "en",
            display_order = 0,
            is_active = true,
        } = req.body;

        logger.info("Creating custom context section", {
            businessId,
            userId: req.user.id,
            sectionName: section_name,
            sectionType: section_type,
            language: language_code,
            contentLength: content?.length,
        });

        // Validate required fields
        if (!section_name || !content) {
            return res.status(400).json({
                success: false,
                error: "Section name and content are required",
                code: "VALIDATION_ERROR",
            });
        }

        // Verify business ownership
        logger.info("Looking up business", {
            businessId,
            userId: req.user.id,
        });

        const business = await Business.findOne({
            where: { id: businessId, owner_id: req.user.id },
        });

        if (!business) {
            logger.warn("Business not found or access denied", {
                businessId,
                userId: req.user.id,
            });
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        logger.info("Business found", {
            businessId: business.id,
            businessName: business.company_name,
        });

        // Calculate character and word counts
        const character_count = content.length;
        const word_count = content.trim().split(/\s+/).length;

        // Generate unique section key
        const section_key = `${section_type}_${Date.now()}`;

        logger.info("Creating custom context section", {
            businessId,
            sectionKey: section_key,
            sectionName: section_name,
            characterCount: character_count,
            wordCount: word_count,
        });

        // Create the custom context section
        const section = await BusinessContextSection.create({
            business_id: businessId,
            section_type,
            section_key,
            language_code,
            section_name,
            content,
            is_active,
            display_order,
            character_count,
            word_count,
            completion_status: "complete",
            embedding_updated_at: new Date(),
            // Note: In production, you would generate embeddings here
            // content_embedding: await generateEmbedding(content),
        });

        logger.info("Custom context section created successfully", {
            businessId,
            userId: req.user.id,
            sectionId: section.id,
            sectionName: section_name,
            characterCount: character_count,
        });

        res.status(201).json({
            success: true,
            data: section,
        });
    } catch (error) {
        logger.error("Create custom context section error", {
            error: error.message,
            stack: error.stack,
            businessId: req.params.businessId,
            userId: req.user?.id,
            requestBody: {
                section_name: req.body?.section_name,
                content: req.body?.content?.substring(0, 100), // Log first 100 chars
                section_type: req.body?.section_type,
                language_code: req.body?.language_code,
                display_order: req.body?.display_order,
                is_active: req.body?.is_active,
            },
            errorType: error.constructor.name,
            validationErrors: error.errors || null,
        });
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/v1/businesses/{businessId}/contexts/{contextId}:
 *   put:
 *     summary: Update custom context section
 *     tags: [Business Contexts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: path
 *         name: contextId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Context section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               section_name:
 *                 type: string
 *                 description: Name of the custom section
 *               content:
 *                 type: string
 *                 description: Section content
 *               section_type:
 *                 type: string
 *                 description: Type of section
 *               display_order:
 *                 type: integer
 *                 description: Display order
 *               is_active:
 *                 type: boolean
 *                 description: Whether section is active
 *     responses:
 *       200:
 *         description: Custom context section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContextSection'
 *       404:
 *         description: Context section not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
    "/:businessId/contexts/:contextId",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const { businessId, contextId } = req.params;
            const {
                section_name,
                content,
                section_type,
                display_order,
                is_active,
            } = req.body;

            logger.info("Updating custom context section", {
                businessId,
                contextId,
                userId: req.user.id,
                sectionName: section_name,
                contentLength: content?.length,
            });

            // Verify business ownership
            const business = await Business.findOne({
                where: { id: businessId, owner_id: req.user.id },
            });

            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                    code: "BUSINESS_NOT_FOUND",
                });
            }

            // Find the context section
            const section = await BusinessContextSection.findOne({
                where: {
                    id: contextId,
                    business_id: businessId,
                },
            });

            if (!section) {
                return res.status(404).json({
                    success: false,
                    error: "Context section not found",
                    code: "CONTEXT_SECTION_NOT_FOUND",
                });
            }

            // Prepare update data
            const updateData = {};

            if (section_name !== undefined)
                updateData.section_name = section_name;
            if (section_type !== undefined)
                updateData.section_type = section_type;
            if (display_order !== undefined)
                updateData.display_order = display_order;
            if (is_active !== undefined) updateData.is_active = is_active;

            if (content !== undefined) {
                updateData.content = content;
                updateData.character_count = content.length;
                updateData.word_count = content.trim().split(/\s+/).length;
                updateData.embedding_updated_at = new Date();
                // Note: In production, you would regenerate embeddings here
                // updateData.content_embedding = await generateEmbedding(content);
            }

            // Update the section
            const updatedSection = await section.update(updateData);

            logger.info("Custom context section updated successfully", {
                businessId,
                contextId,
                userId: req.user.id,
                sectionName: updatedSection.section_name,
                characterCount: updatedSection.character_count,
            });

            res.json({
                success: true,
                data: updatedSection,
            });
        } catch (error) {
            logger.error("Update custom context section error", {
                error: error.message,
                stack: error.stack,
                businessId: req.params.businessId,
                contextId: req.params.contextId,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: "Internal server error",
                code: "INTERNAL_ERROR",
            });
        }
    }
);

/**
 * @swagger
 * /api/v1/businesses/{businessId}/contexts/{contextId}:
 *   delete:
 *     summary: Delete custom context section (soft delete)
 *     tags: [Business Contexts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: path
 *         name: contextId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Context section ID
 *     responses:
 *       200:
 *         description: Custom context section deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Custom context section deleted successfully"
 *       404:
 *         description: Context section not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
    "/:businessId/contexts/:contextId",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const { businessId, contextId } = req.params;

            logger.info("Deleting custom context section", {
                businessId,
                contextId,
                userId: req.user.id,
            });

            // Verify business ownership
            const business = await Business.findOne({
                where: { id: businessId, owner_id: req.user.id },
            });

            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                    code: "BUSINESS_NOT_FOUND",
                });
            }

            // Find the context section
            const section = await BusinessContextSection.findOne({
                where: {
                    id: contextId,
                    business_id: businessId,
                },
            });

            if (!section) {
                return res.status(404).json({
                    success: false,
                    error: "Context section not found",
                    code: "CONTEXT_SECTION_NOT_FOUND",
                });
            }

            // Soft delete by setting is_active to false
            await section.update({ is_active: false });

            logger.info("Custom context section deleted successfully", {
                businessId,
                contextId,
                userId: req.user.id,
                sectionName: section.section_name,
            });

            res.json({
                success: true,
                message: "Custom context section deleted successfully",
            });
        } catch (error) {
            logger.error("Delete custom context section error", {
                error: error.message,
                stack: error.stack,
                businessId: req.params.businessId,
                contextId: req.params.contextId,
                userId: req.user?.id,
            });
            res.status(500).json({
                success: false,
                error: "Internal server error",
                code: "INTERNAL_ERROR",
            });
        }
    }
);

module.exports = router;
