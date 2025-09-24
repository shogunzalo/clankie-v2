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
 * @route   POST /api/businesses
 * @desc    Create a new business
 * @access  Private (requires authentication)
 * @body    { name, description, industry, website, email, phone, address, timezone, planType, settings }
 */
router.post(
    "/",
    authenticateToken,
    validateBusiness,
    BusinessController.createBusiness
);

/**
 * @route   GET /api/businesses
 * @desc    Get all businesses with pagination and filtering
 * @access  Private (requires authentication)
 * @query   { page, limit, industry, planType, isActive }
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
