import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL as string,
});

redisClient.on("error", (err) => {
  console.error("Redis Error", err);
});

export const connectRedis = async () => {
  await redisClient.connect();

  console.log("connected redis");
};
