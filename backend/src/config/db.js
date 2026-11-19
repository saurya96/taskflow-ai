const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error("MONGO_URI is not configured");
        }

        await mongoose.connect(mongoUri);

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.name);
        process.exit(1);
    }
};

module.exports = connectDB;