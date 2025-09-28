"use strict";

const express = require("express");
const router = express.Router();
const {
    Business,
    SectionTemplate,
    SectionTemplateTranslation,
    BusinessTemplateResponse,
} = require("../models");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");
const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("business-templates");

/**
 * @swagger
 * /api/v1/businesses/{businessId}/templates:
 *   get:
 *     summary: Get all templates with completion status
 *     tags: [Business Templates]
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
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
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
 *                     $ref: '#/components/schemas/TemplateWithStatus'
 *       404:
 *         description: Business not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:businessId/templates", verifyFirebaseToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { lang = "en" } = req.query;

        logger.info("Getting templates for business", {
            businessId,
            userId: req.user.id,
            language: lang,
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

        // Get all templates with translations
        const templates = await SectionTemplate.findAll({
            include: [
                {
                    model: SectionTemplateTranslation,
                    as: "translations",
                    where: { language_code: lang },
                    required: false,
                },
            ],
            order: [["display_order", "ASC"]],
        });

        // Get existing responses for this business
        const responses = await BusinessTemplateResponse.findAll({
            where: { business_id: businessId, language_code: lang },
            include: [
                {
                    model: SectionTemplate,
                    as: "template",
                    attributes: ["section_key", "character_min", "character_max"],
                },
            ],
        });

        // Create a map of responses by template_id
        const responseMap = {};
        responses.forEach((response) => {
            responseMap[response.template_id] = response;
        });

        // Combine templates with their status
        const templatesWithStatus = templates.map((template) => {
            const response = responseMap[template.id];
            const translation = template.translations?.[0];

            return {
                id: template.id,
                section_key: template.section_key,
                section_name: translation?.section_name || template.section_key,
                description: translation?.description,
                placeholder_text: translation?.placeholder_text,
                example_content: translation?.example_content,
                is_required: template.is_required,
                display_order: template.display_order,
                character_min: template.character_min,
                character_max: template.character_max,
                content: response?.content || null,
                completion_status: response?.completion_status || "not_started",
                character_count: response?.character_count || 0,
                word_count: response?.word_count || 0,
                progress_percentage: response
                    ? Math.min(
                          100,
                          Math.round(
                              (response.character_count / template.character_max) *
                                  100
                          )
                      )
                    : 0,
                search_hits: response?.search_hits || 0,
                last_accessed: response?.last_accessed,
                created_at: response?.created_at,
                updated_at: response?.updated_at,
            };
        });

        logger.info("Templates retrieved successfully", {
            businessId,
            userId: req.user.id,
            templateCount: templatesWithStatus.length,
            language: lang,
        });

        res.json({
            success: true,
            data: templatesWithStatus,
        });
    } catch (error) {
        logger.error("Get templates error", {
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
 * /api/v1/businesses/{businessId}/templates/{templateId}/response:
 *   get:
 *     summary: Get specific template response
 *     tags: [Business Templates]
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
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code
 *     responses:
 *       200:
 *         description: Template response retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TemplateResponse'
 *       404:
 *         description: Template response not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    "/:businessId/templates/:templateId/response",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const { businessId, templateId } = req.params;
            const { lang = "en" } = req.query;

            logger.info("Getting template response", {
                businessId,
                templateId,
                userId: req.user.id,
                language: lang,
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

            // Get template response
            const response = await BusinessTemplateResponse.findOne({
                where: {
                    business_id: businessId,
                    template_id: templateId,
                    language_code: lang,
                },
                include: [
                    {
                        model: SectionTemplate,
                        as: "template",
                        include: [
                            {
                                model: SectionTemplateTranslation,
                                as: "translations",
                                where: { language_code: lang },
                                required: false,
                            },
                        ],
                    },
                ],
            });

            if (!response) {
                return res.status(404).json({
                    success: false,
                    error: "Template response not found",
                    code: "TEMPLATE_RESPONSE_NOT_FOUND",
                });
            }

            // Update last accessed timestamp
            await response.update({ last_accessed: new Date() });

            logger.info("Template response retrieved successfully", {
                businessId,
                templateId,
                userId: req.user.id,
                characterCount: response.character_count,
            });

            res.json({
                success: true,
                data: response,
            });
        } catch (error) {
            logger.error("Get template response error", {
                error: error.message,
                stack: error.stack,
                businessId: req.params.businessId,
                templateId: req.params.templateId,
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
 * /api/v1/businesses/{businessId}/templates/{templateId}/response:
 *   post:
 *     summary: Create or update template response
 *     tags: [Business Templates]
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
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - language_code
 *             properties:
 *               content:
 *                 type: string
 *                 description: Template response content
 *               language_code:
 *                 type: string
 *                 default: en
 *                 description: Language code
 *     responses:
 *       200:
 *         description: Template response updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TemplateResponse'
 *       201:
 *         description: Template response created successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/:businessId/templates/:templateId/response",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const { businessId, templateId } = req.params;
            const { content, language_code = "en" } = req.body;

            logger.info("Creating/updating template response", {
                businessId,
                templateId,
                userId: req.user.id,
                language: language_code,
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

            // Get template to validate character limits
            const template = await SectionTemplate.findByPk(templateId);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: "Template not found",
                    code: "TEMPLATE_NOT_FOUND",
                });
            }

            // Validate content length
            if (content && content.length < template.character_min) {
                return res.status(400).json({
                    success: false,
                    error: `Content must be at least ${template.character_min} characters`,
                    code: "VALIDATION_ERROR",
                });
            }

            if (content && content.length > template.character_max) {
                return res.status(400).json({
                    success: false,
                    error: `Content must not exceed ${template.character_max} characters`,
                    code: "VALIDATION_ERROR",
                });
            }

            // Calculate character and word counts
            const character_count = content ? content.length : 0;
            const word_count = content ? content.trim().split(/\s+/).length : 0;

            // Determine completion status
            let completion_status = "not_started";
            if (content && content.trim().length >= template.character_min) {
                completion_status = "completed";
            } else if (content && content.trim().length > 0) {
                completion_status = "in_progress";
            }

            // Check if response already exists
            const existingResponse = await BusinessTemplateResponse.findOne({
                where: {
                    business_id: businessId,
                    template_id: templateId,
                    language_code,
                },
            });

            let response;

            if (existingResponse) {
                // Update existing response
                response = await existingResponse.update({
                    content,
                    character_count,
                    word_count,
                    completion_status,
                    embedding_updated_at: content ? new Date() : null,
                    // Note: In production, you would generate embeddings here
                    // content_embedding: await generateEmbedding(content),
                });

                logger.info("Template response updated successfully", {
                    businessId,
                    templateId,
                    userId: req.user.id,
                    responseId: response.id,
                    characterCount: character_count,
                });

                res.json({
                    success: true,
                    data: response,
                });
            } else {
                // Create new response
                response = await BusinessTemplateResponse.create({
                    business_id: businessId,
                    template_id: templateId,
                    language_code,
                    content,
                    character_count,
                    word_count,
                    completion_status,
                    embedding_updated_at: content ? new Date() : null,
                    // Note: In production, you would generate embeddings here
                    // content_embedding: await generateEmbedding(content),
                });

                logger.info("Template response created successfully", {
                    businessId,
                    templateId,
                    userId: req.user.id,
                    responseId: response.id,
                    characterCount: character_count,
                });

                res.status(201).json({
                    success: true,
                    data: response,
                });
            }
        } catch (error) {
            logger.error("Create/update template response error", {
                error: error.message,
                stack: error.stack,
                businessId: req.params.businessId,
                templateId: req.params.templateId,
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
 * /api/v1/businesses/{businessId}/templates/{templateId}/response:
 *   delete:
 *     summary: Delete template response
 *     tags: [Business Templates]
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
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code
 *     responses:
 *       200:
 *         description: Template response deleted successfully
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
 *                   example: "Template response deleted successfully"
 *       404:
 *         description: Template response not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
    "/:businessId/templates/:templateId/response",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const { businessId, templateId } = req.params;
            const { lang = "en" } = req.query;

            logger.info("Deleting template response", {
                businessId,
                templateId,
                userId: req.user.id,
                language: lang,
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

            // Find and delete the response
            const response = await BusinessTemplateResponse.findOne({
                where: {
                    business_id: businessId,
                    template_id: templateId,
                    language_code: lang,
                },
            });

            if (!response) {
                return res.status(404).json({
                    success: false,
                    error: "Template response not found",
                    code: "TEMPLATE_RESPONSE_NOT_FOUND",
                });
            }

            await response.destroy();

            logger.info("Template response deleted successfully", {
                businessId,
                templateId,
                userId: req.user.id,
                responseId: response.id,
            });

            res.json({
                success: true,
                message: "Template response deleted successfully",
            });
        } catch (error) {
            logger.error("Delete template response error", {
                error: error.message,
                stack: error.stack,
                businessId: req.params.businessId,
                templateId: req.params.templateId,
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
