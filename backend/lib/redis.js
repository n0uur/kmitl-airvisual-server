const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_CONNECTION_STRING);

module.exports = redis;
