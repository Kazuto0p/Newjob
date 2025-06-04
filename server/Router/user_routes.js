import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import { authsignup, getSavedJobs, getUser, getusers, logIn, removeSavedJob, savedJobs, Signup, updateProfile, updateRole } from "../controller/user_controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
   
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });


router.get('/uploads/:filename', authenticateUser, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  res.sendFile(filePath);
});


router.post("/signup", Signup);
router.post("/authsignup", authsignup);
router.post("/login", logIn);

// Protected routes
router.post("/users", authenticateUser, getUser);
router.get("/users", authenticateUser, getusers);
router.put("/updateRole", authenticateUser, updateRole);
router.post("/savedJobs", authenticateUser, savedJobs);
router.post("/getSavedJobs", authenticateUser, getSavedJobs);
router.post("/removeSavedJob", authenticateUser, removeSavedJob);
router.put("/users/profile/:id", authenticateUser, upload.fields([
  { name: 'profilepicture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), updateProfile);
router.put("/updateProfile/:id", authenticateUser, upload.fields([
  { name: 'profilepicture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), updateProfile); 

export default router;