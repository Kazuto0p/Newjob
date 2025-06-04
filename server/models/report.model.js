import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    reason: { type: String, required: true },
    reportedBy: { type: String, required: true }, 
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    adminNotes: { type: String },
    jobTitle: { type: String, required: true }, 
    company: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema); 