require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// Import database connection
const db = require("./models");

// Import routes
const businessRoutes = require("./routes/business");
const conversationRoutes = require("./routes/conversation");
const clientRoutes = require("./routes/client");
const faqRoutes = require("./routes/faq");
const serviceRoutes = require("./routes/service");
const platformRoutes = require("./routes/platform");
const webhookRoutes = require("./routes/webhook");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? process.env.FRONTEND_URL
                : [
                      "http://localhost:3000",
                      "http://localhost:3001",
                      "http://localhost:5173",
                  ],
        credentials: true,
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
    message: {
        error: "Too many requests from this IP, please try again later.",
    },
    skip: (req) => {
        // Skip rate limiting for webhook endpoints
        return req.path.startsWith("/webhooks/");
    },
});
app.use("/api/", limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    });
});

// API routes
app.use("/api/v1/businesses", businessRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/faqs", faqRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/platforms", platformRoutes);

// Webhook routes (no rate limiting for webhooks)
app.use("/webhooks", webhookRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Clankie API",
        version: "1.0.0",
        documentation: "/api/v1/docs",
        health: "/health",
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
        method: req.method,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Error:", err);

    // Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
            error: "Validation Error",
            details: err.errors.map((e) => ({
                field: e.path,
                message: e.message,
                value: e.value,
            })),
        });
    }

    // Sequelize unique constraint errors
    if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({
            error: "Duplicate Entry",
            message: "A record with this information already exists",
        });
    }

    // Sequelize foreign key constraint errors
    if (err.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
            error: "Invalid Reference",
            message: "Referenced record does not exist",
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        error:
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : err.message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
});

// Database connection and server startup
const startServer = async () => {
    try {
        // Test database connection
        await db.sequelize.authenticate();
        console.log("✅ Database connection established successfully");

        // Sync database (only in development)
        if (process.env.NODE_ENV === "development") {
            // await db.sequelize.sync({ alter: true });
            console.log("📝 Database sync completed");
        }

        // Start server (skip in test environment)
        if (process.env.NODE_ENV !== "test") {
            app.listen(PORT, () => {
                console.log(`🚀 Server is running on port ${PORT}`);
                console.log(
                    `📖 API Documentation: http://localhost:${PORT}/api/v1/docs`
                );
                console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
                console.log(
                    `🌍 Environment: ${process.env.NODE_ENV || "development"}`
                );
            });
        }
    } catch (error) {
        console.error("❌ Unable to start server:", error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully");
    await db.sequelize.close();
    process.exit(0);
});

process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully");
    await db.sequelize.close();
    process.exit(0);
});

startServer();

module.exports = app;
