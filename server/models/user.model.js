import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    profilepicture: { type: String, default: null },
    resume: { type: String, default: null },
    username: { type: String, required: true },
    email: { type: String, required: true },
    auth0: { type: Boolean, default: false },
    phone: { type: String, default: null },
    password: { type: String, default: null },
    otp: { type: Number, default: null },
    role: { type: String, enum: ["jobSeeker", "recruiter", "admin"], default: null },
    savedjobs: [{ type: String }],
    // Additional profile fields
    location: { type: String, default: null },
    bio: { type: String, default: null },
    skills: { type: String, default: null },
    experience: { type: String, default: null },
    education: { type: String, default: null },
    linkedin: { type: String, default: null },
    github: { type: String, default: null },
    portfolio: { type: String, default: null },
    profileComplete: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);