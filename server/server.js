import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import connection from './connection.js';
import userRoutes from "./Router/user_routes.js"; 
import jobRoutes from "./Router/job_routes.js";
import applicationRoutes from "./Router/application_routes.js";
import adminRoutes from "./Router/admin_routes.js";
import reportRoutes from "./Router/report.routes.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log(path.join(__dirname,"uploads"));

// Basic route for checking server status
app.get('/', (req, res) => {
  res.send("Welcome to Kirito's backend setup!");
});

// Routes
app.use("/api", userRoutes); 
app.use("/api", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes); 
app.use("/api", reportRoutes);

const port = process.env.PORT || 3000;

// Start server
connection().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start server due to DB error:', err);
});