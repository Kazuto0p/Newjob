import express from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.js";
import {
  applyForJob,
  getApplicationsForJobSeeker,
  getApplicationsForRecruiter,
  updateApplicationStatus,
  getResume
} from "../controller/application_controller.js";

const router = express.Router();

// All application routes should be authenticated
router.post("/apply", authenticateUser, upload.single("resume"), applyForJob);
router.get("/recruiter/:recruiterEmail", authenticateUser, getApplicationsForRecruiter);
router.get("/jobseeker/:jobSeekerEmail", authenticateUser, getApplicationsForJobSeeker);
router.patch("/:id", authenticateUser, updateApplicationStatus);
router.get("/:id/resume", authenticateUser, getResume);

export default router;