// import mongoose from "mongoose";

// const jobSchema = new mongoose.Schema({
//   jobTitle: { type: String, default: null },
//   company: { type: String, required: true },
//   location: { type: String, required: true },
//   salary: { type: String, required: true },
//   experiencelvl: { type: String, required: true },
//   role: { type: String, required: true },
//   jobdescription: { type: String, default: null },
//   requirements: { type: String, required: true },
// });

// export default mongoose.model("Job", jobSchema); 


import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, default: null },
    company: { type: String, required: true },
    location: { type: String, required: true },
    salary: { type: String, required: true },
    experiencelvl: { type: String, required: true },
    role: { type: String, required: true },
    jobdescription: { type: String, default: null },
    requirements: [{ type: String, required: true }],
    postedBy: { type: String, default: null }, // Changed from ObjectId to String
    postedByEmail: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);