import "dotenv/config";
import express from "express";
import defaultRouter from "./route";
import { config } from 'dotenv';
config();
const app = express();

app.set("trust proxy", true);
app.use(express.json());
app.use("/api", defaultRouter);

app.get("/", async (req, res) => {
	return res.send("TEST API SERVER");
});

const port = +(process.env.PORT ?? 3000);
const redisUrl = process.env.REDIS_PORT 
  ? `redis://localhost:${process.env.REDIS_PORT}` 
  : process.env.REDIS_URL || "redis://localhost:6379";

app.listen(port, "0.0.0.0", () => {
	console.log("\n" + "=".repeat(60));
	console.log("🚀 TEST API SERVER");
	console.log("=".repeat(60));
	console.log(`📍 Server URL:     http://localhost:${port}`);
	console.log(`📍 API Endpoint:   http://localhost:${port}/api`);
	console.log(`📍 Redis URL:      ${redisUrl.replace(/:[^:@]+@/, ":****@")}`);
	console.log(`📍 Redis Port:     ${process.env.REDIS_PORT || "6379"}`);
	console.log("=".repeat(60) + "\n");
});
