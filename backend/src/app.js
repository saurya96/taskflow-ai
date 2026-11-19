
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");

// 1. Security middleware
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false
}));

// 2. CORS
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// 3. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Authentication routes
app.use("/api/auth", authRoutes);

// 5. Project routes
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

// 6. Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "TaskFlow AI API is running"
    });
});

module.exports = app;
