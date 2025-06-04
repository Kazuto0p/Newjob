import express from "express";
import { createJob, getAllJobs, searchJobs } from "../controller/job_post.js";

const router = express.Router();

// Job listing routes
router.post("/jobs", createJob);
router.get("/jobs", getAllJobs);
router.get("/search",searchJobs)
export default router; 