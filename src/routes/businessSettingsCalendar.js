"use strict";

const express = require("express");
const router = express.Router();
const { Business } = require("../models");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");

/**
 * @swagger
 * /api/business/calendar-settings:
 *   get:
 *     summary: Get calendar integration settings
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     is_enabled:
 *                       type: boolean
 *                     calendar_type:
 *                       type: string
 *                       enum: [google, outlook, apple, custom]
 *                     timezone:
 *                       type: string
 *                     working_hours:
 *                       type: object
 *                       properties:
 *                         start_time:
 *                           type: string
 *                           format: time
 *                         end_time:
 *                           type: string
 *                           format: time
 *                         working_days:
 *                           type: array
 *                           items:
 *                             type: string
 *                             enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                     appointment_duration:
 *                       type: integer
 *                       description: Default appointment duration in minutes
 *                     buffer_time:
 *                       type: integer
 *                       description: Buffer time between appointments in minutes
 *                     max_advance_booking:
 *                       type: integer
 *                       description: Maximum days in advance for booking
 *                     min_advance_booking:
 *                       type: integer
 *                       description: Minimum hours in advance for booking
 *                     auto_confirm:
 *                       type: boolean
 *                     send_reminders:
 *                       type: boolean
 *                     reminder_times:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: Reminder times in hours before appointment
 *                     integration_settings:
 *                       type: object
 *                       description: Platform-specific integration settings
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
            attributes: ["calendar_settings"],
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        // Default calendar settings
        const defaultSettings = {
            is_enabled: false,
            calendar_type: "google",
            timezone: business.timezone || "UTC",
            working_hours: {
                start_time: "09:00",
                end_time: "17:00",
                working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            },
            appointment_duration: 60, // minutes
            buffer_time: 15, // minutes
            max_advance_booking: 30, // days
            min_advance_booking: 2, // hours
            auto_confirm: false,
            send_reminders: true,
            reminder_times: [24, 2], // hours before appointment
            integration_settings: {
                google: {
                    calendar_id: null,
                    access_token: null,
                    refresh_token: null,
                },
                outlook: {
                    calendar_id: null,
                    access_token: null,
                    refresh_token: null,
                },
                apple: {
                    calendar_id: null,
                    credentials: null,
                },
            },
        };

        const calendarSettings = business.calendar_settings || defaultSettings;

        res.json({
            success: true,
            data: calendarSettings,
        });
    } catch (error) {
        console.error("Get calendar settings error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/calendar-settings:
 *   put:
 *     summary: Update calendar settings
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
 *               is_enabled:
 *                 type: boolean
 *               calendar_type:
 *                 type: string
 *                 enum: [google, outlook, apple, custom]
 *               timezone:
 *                 type: string
 *               working_hours:
 *                 type: object
 *                 properties:
 *                   start_time:
 *                     type: string
 *                     format: time
 *                   end_time:
 *                     type: string
 *                     format: time
 *                   working_days:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               appointment_duration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *               buffer_time:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 60
 *               max_advance_booking:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *               min_advance_booking:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 168
 *               auto_confirm:
 *                 type: boolean
 *               send_reminders:
 *                 type: boolean
 *               reminder_times:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 168
 *               integration_settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Calendar settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/", verifyFirebaseToken, async (req, res) => {
    try {
        const {
            is_enabled,
            calendar_type,
            timezone,
            working_hours,
            appointment_duration,
            buffer_time,
            max_advance_booking,
            min_advance_booking,
            auto_confirm,
            send_reminders,
            reminder_times,
            integration_settings,
        } = req.body;

        // Validate numeric constraints
        if (appointment_duration && (appointment_duration < 15 || appointment_duration > 480)) {
            return res.status(400).json({
                success: false,
                error: "Appointment duration must be between 15 and 480 minutes",
                code: "VALIDATION_ERROR",
            });
        }

        if (buffer_time && (buffer_time < 0 || buffer_time > 60)) {
            return res.status(400).json({
                success: false,
                error: "Buffer time must be between 0 and 60 minutes",
                code: "VALIDATION_ERROR",
            });
        }

        if (max_advance_booking && (max_advance_booking < 1 || max_advance_booking > 365)) {
            return res.status(400).json({
                success: false,
                error: "Max advance booking must be between 1 and 365 days",
                code: "VALIDATION_ERROR",
            });
        }

        if (min_advance_booking && (min_advance_booking < 1 || min_advance_booking > 168)) {
            return res.status(400).json({
                success: false,
                error: "Min advance booking must be between 1 and 168 hours",
                code: "VALIDATION_ERROR",
            });
        }

        // Validate reminder times
        if (reminder_times && Array.isArray(reminder_times)) {
            for (const time of reminder_times) {
                if (time < 1 || time > 168) {
                    return res.status(400).json({
                        success: false,
                        error: "Reminder times must be between 1 and 168 hours",
                        code: "VALIDATION_ERROR",
                    });
                }
            }
        }

        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (working_hours) {
            if (working_hours.start_time && !timeRegex.test(working_hours.start_time)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid start time format",
                    code: "VALIDATION_ERROR",
                });
            }
            if (working_hours.end_time && !timeRegex.test(working_hours.end_time)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid end time format",
                    code: "VALIDATION_ERROR",
                });
            }
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

        // Get current settings
        const currentSettings = business.calendar_settings || {};

        // Update settings
        const updatedSettings = {
            ...currentSettings,
            is_enabled: is_enabled !== undefined ? is_enabled : currentSettings.is_enabled,
            calendar_type: calendar_type || currentSettings.calendar_type,
            timezone: timezone || currentSettings.timezone,
            working_hours: working_hours || currentSettings.working_hours,
            appointment_duration: appointment_duration || currentSettings.appointment_duration,
            buffer_time: buffer_time !== undefined ? buffer_time : currentSettings.buffer_time,
            max_advance_booking: max_advance_booking || currentSettings.max_advance_booking,
            min_advance_booking: min_advance_booking !== undefined ? min_advance_booking : currentSettings.min_advance_booking,
            auto_confirm: auto_confirm !== undefined ? auto_confirm : currentSettings.auto_confirm,
            send_reminders: send_reminders !== undefined ? send_reminders : currentSettings.send_reminders,
            reminder_times: reminder_times || currentSettings.reminder_times,
            integration_settings: integration_settings || currentSettings.integration_settings,
        };

        await business.update({ calendar_settings: updatedSettings });

        res.json({
            success: true,
            data: updatedSettings,
        });
    } catch (error) {
        console.error("Update calendar settings error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

module.exports = router;
