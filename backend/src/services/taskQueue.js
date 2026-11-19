
const redisConnection = require("../config/redis");

const enqueueTask = async (taskId) => {
    await redisConnection.lpush(
        "task-processing",
        JSON.stringify({ taskId })
    );
};

module.exports = enqueueTask;
