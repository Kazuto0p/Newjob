import Report from '../models/report.model.js';
import Job from '../models/job.model.js';

export const createReport = async (req, res) => {
  try {
    const { jobId, reason, reportedBy } = req.body;
    console.log('Received report data:', { jobId, reason, reportedBy });

    // Validate input
    if (!jobId || !reason || !reportedBy) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const report = new Report({
      jobId,
      reason,
      reportedBy,
      jobTitle: job.jobTitle || 'Untitled Job',
      company: job.company
    });

    console.log('Creating report:', report);
    await report.save();
    console.log('Report saved successfully');
    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error while creating report' });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 }); // Most recent first
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error while fetching reports' });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findByIdAndUpdate(
      reportId,
      { status, adminNotes },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({ message: 'Report updated successfully', report });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error while updating report' });
  }
}; 