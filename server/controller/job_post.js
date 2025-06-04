

import Job from "../models/job.model.js"
import User from "../models/user.model.js";


export const createJob = async (req, res) => {
  try {
    console.log("Received job data:", req.body);
    const {
      jobTitle,
      company,
      location,
      salary,
      experiencelvl,
      role,
      jobdescription,
      requirements,
      postedBy,
      postedByEmail,
    } = req.body;

    // Validate required fields
    if (!company || !location || !salary || !experiencelvl || !role || !requirements) {
      console.log("Missing required fields:", { company, location, salary, experiencelvl, role, requirements });
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate postedByEmail and user role
    if (!postedByEmail) {
      console.log("Missing postedByEmail");
      return res.status(400).json({ message: "Recruiter email is required" });
    }
    const user = await User.findOne({ email: postedByEmail });
    if (!user) {
      console.log(`User not found for email: ${postedByEmail}`);
      return res.status(403).json({ message: "User not found" });
    }
    if (user.role !== "recruiter") {
      console.log(`User is not a recruiter: ${postedByEmail}, role: ${user.role}`);
      return res.status(403).json({ message: "Only recruiters can post jobs" });
    }

    // Validate requirements is an array
    if (!Array.isArray(requirements) || requirements.length === 0) {
      console.log("Invalid requirements:", requirements);
      return res.status(400).json({ message: "Requirements must be a non-empty array" });
    }

    const job = new Job({
      jobTitle: jobTitle || null,
      company,
      location,
      salary,
      experiencelvl,
      role,
      jobdescription: jobdescription || null,
      requirements,
      postedBy: postedBy || null, // Now a string (e.g., "google-oauth2|116099331485005907276")
      postedByEmail,
    });

    console.log("Saving job:", job);
    await job.save();
    console.log("Job saved successfully");
    res.status(201).json({ message: "Job posted successfully", job });
  } catch (error) {
    console.error("Error creating job:", error.message, error.stack);
    res.status(500).json({ message: "Server error while posting job", error: error.message });
  }
};

export const searchJobs = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query is required", jobs: [] });
    }
    const jobs = await Job.find({
      $or: [
        { jobTitle: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    }).select("jobTitle company location salary experiencelvl role description postedByEmail createdAt");
    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Error searching jobs:", error);
    res.status(500).json({ message: "Server error while searching jobs" });
  }
};


export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().select(
      "jobTitle company location salary experiencelvl role jobdescription requirements postedByEmail"
    );
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server error while fetching jobs" });
  }
};