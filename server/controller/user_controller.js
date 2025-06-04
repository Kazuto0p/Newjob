import bcrypt from "bcrypt";
import userModel from "../models/user.model.js"; 
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Job from "../models/job.model.js";


const JWT_SECRET = process.env.JWT_KEY || "your_jwt_secret";

export async function Signup(req, res) {
  try {
    const { email, password, username, role } = req.body;


    if (!email || !password || !username) {
      return res.status(400).json({ message: "Please fill all the details" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);


    const data = await userModel.create({
      email,
      username,
      password: hashedPassword,
      role: null
    });


    const token = jwt.sign(
      { 
        userId: data._id, 
        email: data.email,
        role: data.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: "User created successfully", 
      token, 
      data,
      needsRole: true
    });
  } catch (error) {
    console.error("Error in Signup:", error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
}

export async function logIn(req, res) {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Check if user exists
    const userExist = await userModel.findOne({ email });
    if (!userExist) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare passwords
    const isPassMatch = await bcrypt.compare(password, userExist.password);
    if (!isPassMatch) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    // Generate JWT token with consistent secret
    const token = jwt.sign(
      { 
        userId: userExist._id, 
        email: userExist.email,
        role: userExist.role
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({ 
      message: "Logged in successfully", 
      token,
      data: userExist 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error signing in", error: error.message });
  }
}

export async function authsignup(req, res) {
  try {
    console.log("authsignup");
    const { username, email, role } = req.body;
  
    const userExist = await userModel.findOne({ email });

    if (userExist) {
      // If user exists and has a role, return as is
      if (userExist.auth0 && userExist.role) {
        return res.status(200).send({ 
          data: userExist,
          needsRole: false
        });
      }
      // If user exists but has no role, indicate role selection needed
      if (userExist.auth0) {
        return res.status(200).send({ 
          data: userExist,
          needsRole: true
        });
      }
    }


    const data = await userModel.create({ 
      username, 
      email, 
      auth0: true,
      role: null 
    });
    
    res.status(201).send({
      data,
      needsRole: true 
    });
  } catch (error) {
    console.error("Error in authsignup:", error);
    res.status(500).send({ message: "failed in store db", error: error.message });
  }
}

export async function getUser(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const data = await userModel.findOne({ email });
    
    if (!data) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

export async function updateRole(req, res) {
  try {
    const { email, role } = req.body;
    console.log('Attempting to update role:', { email, role });

    if (!email || !role) {
      console.log('Missing required fields:', { email, role });
      return res.status(400).json({ message: "Email and role are required" });
    }

    if (!["jobSeeker", "recruiter"].includes(role)) {
      console.log('Invalid role provided:', role);
      return res
        .status(400)
        .json({ message: "Invalid role. Must be 'jobSeeker' or 'recruiter'" });
    }

    // Find user first to verify they exist
    const existingUser = await userModel.findOne({ email });
    if (!existingUser) {
      console.log('User not found for email:', email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Current user state:', existingUser);

    const updatedUser = await userModel.findOneAndUpdate(
      { email: email },
      { 
        $set: {
          role: role,
          profileComplete: false 
        }
      },
      { new: true }
    );

    console.log('Role update result:', updatedUser);
    res.status(200).json({
      message: "Role updated successfully",
      data: updatedUser,
      needsProfile: true 
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Error updating role", error: error.message });
  }
}

export async function getusers(req, res) {
  try {
    
    const data = await userModel.find();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: "failed to fetch data", error });
  }
}

export async function savedJobs(req, res) {
  // console.log("=== Starting savedJobs function ===");
  try {
    const { email, jobId } = req.body;
    console.log('Attempting to save job:', { email, jobId });

    if (!email || !jobId) {
      console.log('Missing required fields:', { email, jobId });
      return res.status(400).json({ message: "Email or jobId is missing" });
    }

    // Validate jobId as a valid ObjectId string
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      console.log('Invalid job ID format:', jobId);
      return res.status(400).json({ message: "Invalid job ID" });
    }

    // First check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      console.log('Job not found:', jobId);
      return res.status(404).json({ message: "Job not found" });
    }

    // First find the user to check current saved jobs
    const existingUser = await userModel.findOne({ email });
    console.log('Found user:', {
      email: existingUser?.email,
      currentSavedJobs: existingUser?.savedjobs || []
    });

    if (!existingUser) {
      console.log('User not found:', email);
      return res.status(404).json({ message: "User not found" });
    }

    // Add the jobId string to the savedjobs array
    const updatedUser = await userModel.findOneAndUpdate(
      { email: email },
      { $addToSet: { savedjobs: jobId.toString() } },
      { new: true }
    );

    console.log('Updated user saved jobs:', {
      email: updatedUser.email,
      savedJobs: updatedUser.savedjobs
    });

    res.status(200).json({ 
      message: "Job saved successfully", 
      savedjobs: updatedUser.savedjobs 
    });
  } catch (error) {
    console.error("Error in savedJobs:", error);
    res.status(500).json({ 
      message: "Error saving job", 
      error: error.message 
    });
  }
}

export async function getSavedJobs(req, res) {
  // console.log("=== Starting getSavedJobs function ===");
  try {
    const { email } = req.body;
    console.log('Attempting to fetch saved jobs for email:', email);

    if (!email) {
      console.log('No email provided');
      return res.status(400).json({ message: "Email missing" });
    }

    const user = await userModel.findOne({ email });
    console.log('Found user:', {
      email: user?.email,
      hasSavedJobs: !!user?.savedjobs,
      savedJobsCount: user?.savedjobs?.length || 0,
      savedJobs: user?.savedjobs || []
    });

    if (!user) {
      console.log('User not found:', email);
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.savedjobs || user.savedjobs.length === 0) {
      console.log('No saved jobs found for user');
      return res.status(200).json({ savedJobs: [] });
    }


    const jobIds = user.savedjobs
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    console.log('Converted job IDs:', jobIds);

    const jobs = await Job.find({ _id: { $in: jobIds } });
    console.log('Found jobs:', {
      requestedCount: jobIds.length,
      foundCount: jobs.length,
      jobs: jobs.map(j => ({ id: j._id, title: j.jobTitle }))
    });

    res.status(200).json({ savedJobs: jobs });
  } catch (error) {
    console.error("Error in getSavedJobs:", error);
    res.status(500).json({ 
      message: "Error fetching saved jobs", 
      error: error.message 
    });
  }
}

export async function removeSavedJob(req, res) {
  try {
    const { email, jobId } = req.body;

    if (!email || !jobId) {
      return res.status(400).json({ message: "Email or jobId is missing" });
    }


    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job ID format" });
    }

    const jobIdStr = jobId.toString();

 
    const userBefore = await userModel.findOne({ email }).lean();
    console.log("Before update savedjobs:", userBefore?.savedjobs);

    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      { $pull: { savedjobs: jobIdStr } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log after update
    console.log("After update savedjobs:", updatedUser.savedjobs);

    return res.status(200).json({
      message: "Job removed successfully",
      savedJobs: updatedUser.savedjobs,
    });
  } catch (error) {
    console.error("Error removing saved job:", error);
    return res.status(500).json({
      message: "Error removing saved job",
      error: error.message,
    });
  }
}

export async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('Updating profile for user:', id);
    console.log('Update data:', updates);

    // Handle file uploads
    if (req.files) {
      if (req.files.profilepicture) {
        updates.profilepicture = req.files.profilepicture[0].path;
      }
      if (req.files.resume) {
        updates.resume = req.files.resume[0].path;
      }
    }

    // Find user first to preserve existing data
    const existingUser = await userModel.findById(id);
    if (!existingUser) {
      console.log('User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Preserve the existing role if it's admin or if no new role is provided
    if (existingUser.role === 'admin' || !updates.role) {
      updates.role = existingUser.role;
    }

    updates.profileComplete = true;

    const user = await userModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    console.log('Profile updated successfully:', user);
    res.json({ data: user });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', error: error.message });
    }
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
}