import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';

const CompanyDashboard = () => {
  const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch jobs and applications
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Verify user is a recruiter
      const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (userResponse.data.role !== 'recruiter') {
        setError('Access restricted to recruiters');
        setLoading(false);
        return;
      }

      // Fetch jobs posted by recruiter
      const jobsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/jobs/my-jobs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      setJobs(jobsResponse.data);

      // Fetch applications for recruiter's jobs
      const appsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/applications/my-jobs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      setApplications(appsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Delete a job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      setApplications((prev) => prev.filter((app) => app.jobId !== jobId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting job');
    }
  };

  // Update application status
  const handleUpdateStatus = async (applicationId, status) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/applications/${applicationId}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
      );
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, status } : app))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating application status');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    loginWithRedirect();
    return null;
  }

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Company Dashboard</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Posted Jobs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Your Posted Jobs</h2>
          <button
            onClick={() => navigate('/post-job')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primaryHover transition-all transform hover:scale-105"
          >
            Post New Job
          </button>
        </div>
        {jobs.length === 0 ? (
          <p className="text-gray-600">No jobs posted yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white shadow-md rounded-lg p-4">
                <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                <p className="text-gray-600">{job.company} - {job.location}</p>
                <p className="text-gray-600">Salary: ${job.salary.toLocaleString()}</p>
                <p className="text-gray-600">Experience: {job.experience}</p>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => navigate(`/edit-job/${job._id}`)}
                    className="text-primary hover:text-primaryHover flex items-center"
                  >
                    <Edit size={18} className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job._id)}
                    className="text-red-500 hover:text-red-600 flex items-center"
                  >
                    <Trash2 size={18} className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applications */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Applications Received</h2>
        {applications.length === 0 ? (
          <p className="text-gray-600">No applications received yet.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-gray-700">Job Title</th>
                  <th className="p-3 text-gray-700">Applicant Email</th>
                  <th className="p-3 text-gray-700">Status</th>
                  <th className="p-3 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} className="border-t">
                    <td className="p-3">{jobs.find((j) => j._id === app.jobId)?.title || 'N/A'}</td>
                    <td className="p-3">{app.userEmail}</td>
                    <td className="p-3 capitalize">{app.status}</td>
                    <td className="p-3 flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(app._id, 'accepted')}
                        className={`text-green-500 hover:text-green-600 ${
                          app.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={app.status !== 'pending'}
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app._id, 'rejected')}
                        className={`text-red-500 hover:text-red-600 ${
                          app.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={app.status !== 'pending'}
                      >
                        <XCircle size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;