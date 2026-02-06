import express from "express";
import { createRedis } from "../../index";
import { Test, TestAutoSetKeys, TestCreate, TestUpdate } from "../interface/Test";

const defaultRouter = express.Router();

// Redis 인스턴스 생성
const redis = createRedis<Test, TestAutoSetKeys>({
  table: "test:data",
});

// GET / - 모든 테스트 데이터 목록 (간단한 예시)
defaultRouter.get("/", async (req, res) => {
  try {
    return res.json({ message: "Hello World", endpoints: [
      "GET /:id - Get test data by id",
      "POST / - Create test data",
      "PUT /:id - Update test data",
      "DELETE /:id - Delete test data",
      "GET /:id/exists - Check if test data exists",
      "GET /:id/ttl - Get remaining TTL",
      "PUT /:id/expire - Set expiration time",
    ]});
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /:id - 테스트 데이터 조회
defaultRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await redis.read(id);

    if (data === null) {
      return res.status(404).json({ error: "Test data not found" });
    }

    return res.json({ data });
  } catch (error) {
    console.error("Error reading test data:", error);
    return res.status(500).json({ error: "Failed to read test data" });
  }
});

const a:Record<string, any>={
  "TREG_ASDF_14214": "hi",
}

// POST / - 테스트 데이터 생성
defaultRouter.post("/", async (req, res) => {
  try {
    const body: TestCreate = req.body;
    const id = Date.now();
    const testData: TestCreate = {
      text: body.text,
      number: body.number,
      numbers: body.numbers,
      date: new Date(body.date || Date.now()),
    };
    await redis.create(String(id), testData);
    return res.status(201).json({ 
      message: "Test data created successfully",
      data: testData,
    });
  } catch (error) {
    console.error("Error creating test data:", error);
    return res.status(500).json({ error: "Failed to create test data" });
  }
});

// PUT /:id - 테스트 데이터 업데이트
defaultRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: TestUpdate = req.body;

    const updated = await redis.update(id, updateData);

    if (updated === null) {
      return res.status(404).json({ error: "Test data not found" });
    }

    return res.json({ 
      message: "Test data updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating test data:", error);
    return res.status(500).json({ error: "Failed to update test data" });
  }
});

// DELETE /:id - 테스트 데이터 삭제
defaultRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await redis.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Test data not found" });
    }

    return res.json({ message: "Test data deleted successfully" });
  } catch (error) {
    console.error("Error deleting test data:", error);
    return res.status(500).json({ error: "Failed to delete test data" });
  }
});

// GET /:id/exists - 테스트 데이터 존재 여부 확인
defaultRouter.get("/:id/exists", async (req, res) => {
  try {
    const { id } = req.params;
    const exists = await redis.exists(id);

    return res.json({ exists });
  } catch (error) {
    console.error("Error checking test data existence:", error);
    return res.status(500).json({ error: "Failed to check test data existence" });
  }
});

// GET /:id/ttl - 남은 만료 시간 조회
defaultRouter.get("/:id/ttl", async (req, res) => {
  try {
    const { id } = req.params;
    const ttl = await redis.getTtl(id);

    if (ttl === null) {
      return res.json({ ttl: null, message: "No expiration time set" });
    }

    return res.json({ ttl, unit: "seconds" });
  } catch (error) {
    console.error("Error getting TTL:", error);
    return res.status(500).json({ error: "Failed to get TTL" });
  }
});

// PUT /:id/expire - 만료 시간 설정
defaultRouter.put("/:id/expire", async (req, res) => {
  try {
    const { id } = req.params;
    const { seconds } = req.body;

    if (typeof seconds !== "number" || seconds <= 0) {
      return res.status(400).json({ error: "Invalid seconds value. Must be a positive number." });
    }

    const success = await redis.setExpire(id, seconds);

    if (!success) {
      return res.status(404).json({ error: "Test data not found" });
    }

    return res.json({ 
      message: "Expiration time set successfully",
      seconds,
    });
  } catch (error) {
    console.error("Error setting expiration:", error);
    return res.status(500).json({ error: "Failed to set expiration time" });
  }
});

export default defaultRouter;
