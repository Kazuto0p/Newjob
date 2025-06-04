import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from 'react-router-dom';
import Header from '../../Components/Header/Header';
import Title from '../../Components/Title/Title';
import Navigation from '../../Components/Navigation/Navigation';
import SearchBar from '../../Components/SearchBar/SearchBar';
import JobCard from '../../Components/JobCard/JobCard';
import { useUser } from '../../UserContext';

const ReportModal = ({ job, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-11/12 max-w-md">
        <h3 className="text-xl font-bold mb-4">Report Job</h3>
        <p className="mb-2 text-gray-600">Job: {job.jobTitle} at {job.company}</p>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-2 border rounded-md mb-4 h-32"
            placeholder="Please describe why you are reporting this job..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const { user, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const { userData } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/jobs`);
        setJobs(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch jobs. Please try again later.');
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  const handleReportClick = () => {
    if (!isAuthenticated && !userData) {
      toast.info('Please log in to report jobs');
      loginWithRedirect({
        appState: { returnTo: window.location.pathname }
      });
      return;
    }
    setShowReportModal(true);
  };

  const handleReport = async (reason) => {
    try {
      let token;
      if (isAuthenticated) {
        try {
          token = await getAccessTokenSilently({
            authorizationParams: {
              audience: "https://job-platform.api",
              scope: "openid profile email"
            }
          });
        } catch (error) {
          console.error('Error getting Auth0 token:', error);
          // Fallback to regular token
          token = localStorage.getItem('token');
        }
      } else if (userData) {
        token = localStorage.getItem('token');
      }

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      await axios.post('http://localhost:3000/api/reports', {
        jobId: selectedJob._id,
        reason,
        reportedBy: userData?.email || user?.email
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Job reported successfully');
      setShowReportModal(false);
    } catch (error) {
      console.error('Error reporting job:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to report jobs');
        if (loginWithRedirect) {
          loginWithRedirect({
            appState: { returnTo: window.location.pathname }
          });
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to report job. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Title />
      <Navigation />
      <SearchBar />
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto p-4 gap-4">
        {/* Job Cards Column */}
        <div className="w-full lg:w-1/2">
          {loading ? (
            <div className="p-4 text-center text-gray-600">Loading jobs...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error}</div>
          ) : jobs.length === 0 ? (
            <div className="p-4 text-center text-gray-600">No jobs found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => handleJobClick(job)}
                  className={`cursor-pointer ${selectedJob?._id === job._id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <JobCard
                    _id={job._id}
                    company={job.company}
                    title={job.jobTitle || 'Untitled Job'}
                    salary={job.salary}
                    location={job.location}
                    type={job.experiencelvl}
                    role={job.role}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Job Details Panel */}
        <div className="w-full lg:w-1/2 bg-white p-6 rounded-lg shadow-md hidden lg:block">
          {selectedJob ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedJob.jobTitle || 'Untitled Job'}</h2>
              <p className="text-lg text-gray-600">{selectedJob.company}</p>
              <div className="mt-4 space-y-2">
                <p><span className="font-semibold">Location:</span> {selectedJob.location}</p>
                <p><span className="font-semibold">Salary:</span> {selectedJob.salary}</p>
                <p><span className="font-semibold">Experience Level:</span> {selectedJob.experiencelvl}</p>
                <p><span className="font-semibold">Role:</span> {selectedJob.role}</p>
                {selectedJob.description && (
                  <p><span className="font-semibold">Description:</span> {selectedJob.description}</p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  onClick={() => setSelectedJob(null)}
                >
                  Close
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                  onClick={handleReportClick}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                  Report
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-600">
              Select a job to view details
            </div>
          )}
        </div>
        {/* Mobile Job Details Modal */}
        {selectedJob && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-11/12 max-w-md">
              <h2 className="text-2xl font-bold text-gray-800">{selectedJob.jobTitle || 'Untitled Job'}</h2>
              <p className="text-lg text-gray-600">{selectedJob.company}</p>
              <div className="mt-4 space-y-2">
                <p><span className="font-semibold">Location:</span> {selectedJob.location}</p>
                <p><span className="font-semibold">Salary:</span> {selectedJob.salary}</p>
                <p><span className="font-semibold">Experience Level:</span> {selectedJob.experiencelvl}</p>
                <p><span className="font-semibold">Role:</span> {selectedJob.role}</p>
                {selectedJob.description && (
                  <p><span className="font-semibold">Description:</span> {selectedJob.description}</p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex-1"
                  onClick={() => setSelectedJob(null)}
                >
                  Close
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex-1 flex items-center justify-center gap-2"
                  onClick={handleReportClick}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                  Report
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Report Modal */}
        {showReportModal && selectedJob && (
          <ReportModal
            job={selectedJob}
            onClose={() => setShowReportModal(false)}
            onSubmit={handleReport}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;