// =====================================
// BUSINESS ROUTES
// =====================================

const express = require("express");
const router = express.Router();
const BusinessController = require("../controllers/BusinessController");
const {
    authenticateToken,
    checkBusinessOwnership,
} = require("../middleware/auth");
const {
    validateBusiness,
    validateId,
    validatePagination,
} = require("../middleware/validation");

// =====================================
// BUSINESS CRUD ROUTES
// =====================================

/**
 * @swagger
 * /api/v1/businesses:
 *   post:
 *     summary: Create a new business
 *     description: Create a new business entity for the authenticated user
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - owner_email
 *             properties:
 *               company_name:
 *                 type: string
 *                 description: Company name
 *                 example: "Acme Corp"
 *               owner_email:
 *                 type: string
 *                 format: email
 *                 description: Owner email address
 *                 example: "owner@acme.com"
 *               industry:
 *                 type: string
 *                 description: Business industry
 *                 example: "Technology"
 *               business_type:
 *                 type: string
 *                 enum: [SaaS, E-commerce, Service, Manufacturing, Other]
 *                 description: Type of business
 *                 example: "SaaS"
 *               plan_type:
 *                 type: string
 *                 enum: [basic, premium, enterprise]
 *                 description: Subscription plan type
 *                 example: "premium"
 *               settings:
 *                 type: object
 *                 description: Business-specific settings
 *                 example: {"timezone": "UTC", "currency": "USD"}
 *     responses:
 *       201:
 *         description: Business created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/",
    authenticateToken,
    validateBusiness,
    BusinessController.createBusiness
);

/**
 * @swagger
 * /api/v1/businesses:
 *   get:
 *     summary: Get all businesses
 *     description: Retrieve all businesses with pagination and filtering options
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *         example: "Technology"
 *       - in: query
 *         name: plan_type
 *         schema:
 *           type: string
 *           enum: [basic, premium, enterprise]
 *         description: Filter by plan type
 *         example: "premium"
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *     responses:
 *       200:
 *         description: List of businesses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 businesses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Business'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    "/",
    authenticateToken,
    validatePagination,
    BusinessController.getBusinesses
);

/**
 * @route   GET /api/businesses/:businessId
 * @desc    Get a specific business by ID
 * @access  Private (requires authentication)
 * @params  { businessId }
 */
router.get(
    "/:businessId",
    authenticateToken,
    validateId,
    BusinessController.getBusiness
);

/**
 * @route   PUT /api/businesses/:businessId
 * @desc    Update a business
 * @access  Private (requires authentication)
 * @params  { businessId }
 * @body    { name, description, industry, website, email, phone, address, timezone, planType, settings }
 */
router.put(
    "/:businessId",
    authenticateToken,
    validateId,
    validateBusiness,
    BusinessController.updateBusiness
);

/**
 * @route   DELETE /api/businesses/:businessId
 * @desc    Delete a business
 * @access  Private (requires authentication)
 * @params  { businessId }
 */
router.delete(
    "/:businessId",
    authenticateToken,
    validateId,
    BusinessController.deleteBusiness
);

// =====================================
// BUSINESS STATISTICS ROUTES
// =====================================

/**
 * @route   GET /api/businesses/:businessId/stats
 * @desc    Get business statistics and analytics
 * @access  Private (requires authentication)
 * @params  { businessId }
 */
router.get(
    "/:businessId/stats",
    authenticateToken,
    validateId,
    BusinessController.getBusinessStats
);

// =====================================
// BUSINESS RELATIONSHIP ROUTES
// =====================================

/**
 * @route   GET /api/businesses/:businessId/clients
 * @desc    Get all clients for a business
 * @access  Private (requires authentication)
 * @params  { businessId }
 * @query   { page, limit, status }
 */
router.get(
    "/:businessId/clients",
    authenticateToken,
    validateId,
    validatePagination,
    BusinessController.getBusinessClients
);

/**
 * @route   GET /api/businesses/:businessId/services
 * @desc    Get all services for a business
 * @access  Private (requires authentication)
 * @params  { businessId }
 */
router.get(
    "/:businessId/services",
    authenticateToken,
    validateId,
    BusinessController.getBusinessServices
);

/**
 * @route   GET /api/businesses/:businessId/faqs
 * @desc    Get all FAQ items for a business
 * @access  Private (requires authentication)
 * @params  { businessId }
 * @query   { category, isActive }
 */
router.get(
    "/:businessId/faqs",
    authenticateToken,
    validateId,
    BusinessController.getBusinessFaqs
);

// =====================================
// BUSINESS SETTINGS ROUTES
// =====================================

/**
 * @route   PUT /api/businesses/:businessId/settings
 * @desc    Update business settings
 * @access  Private (requires authentication)
 * @params  { businessId }
 * @body    { settings }
 */
router.put(
    "/:businessId/settings",
    authenticateToken,
    validateId,
    BusinessController.updateBusinessSettings
);

/**
 * @route   PATCH /api/businesses/:businessId/toggle-status
 * @desc    Toggle business active status
 * @access  Private (requires authentication)
 * @params  { businessId }
 */
router.patch(
    "/:businessId/toggle-status",
    authenticateToken,
    validateId,
    BusinessController.toggleBusinessStatus
);

module.exports = router;
