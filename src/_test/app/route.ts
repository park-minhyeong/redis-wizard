import express from "express";

const defaultRouter = express.Router();

defaultRouter.get("/", async (req, res) => {
  return res.json({message:"Hello World"});
});



export default defaultRouter;
