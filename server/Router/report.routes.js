import express from "express";
import { createReport, getReports, updateReportStatus } from "../controller/report.controller.js";
import { authenticateUser, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new report (any authenticated user)
router.post("/reports", authenticateUser, createReport);

// Get all reports (admin only)
router.get("/reports", authenticateUser, isAdmin, getReports);

// Update report status (admin only)
router.patch("/reports/:reportId", authenticateUser, isAdmin, updateReportStatus);

export default router; 