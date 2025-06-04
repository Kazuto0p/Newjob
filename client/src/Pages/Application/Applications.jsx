import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "react-toastify";
import { useUser } from "../../UserContext";

// Sidebar Component
const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-white shadow-md">
      <div className="p-4">
        <Link to="/">
          <h1 className="text-2xl font-bold text-blue-600">GetJob</h1>
        </Link>
      </div>
      <nav className="mt-4">
        <Link
          to="/dashboard"
          className="flex items-center p-4 text-gray-600 hover:text-blue-600"
        >
          <span className="mr-2">🏠</span> Dashboard
        </Link>
        <Link
          to="/savedjobs"
          className="flex items-center p-4 text-gray-600 hover:text-blue-600"
        >
          <span className="mr-2">💼</span> Saved Jobs
        </Link>
        <Link
          to="/profile"
          className="flex items-center p-4 text-gray-600 hover:text-blue-600"
        >
          <span className="mr-2">👤</span> Profile
        </Link>
      </nav>
    </div>
  );
};

// ApplicationCard Component
const ApplicationCard = ({ jobTitle, company, location, status }) => {
  return (
    <div className="border rounded p-4 m-2 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-bold">
          {jobTitle} at {company}
        </h3>
        <p className="text-gray-600">{location}</p>
      </div>
      <span
        className={`px-4 py-1 rounded ${
          status === "accepted"
            ? "bg-green-100 text-green-600"
            : status === "rejected"
            ? "bg-red-100 text-red-600"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
};

// ApplicationForm Component
const ApplicationForm = ({ jobId, onClose }) => {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { userData } = useUser();
  const navigate = useNavigate();

  const getAuthToken = async () => {
    if (isAuthenticated) {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "https://job-platform.api",
            scope: "openid profile email"
          }
        });
        return token;
      } catch (error) {
        console.error('Error getting Auth0 token:', error);
        const regularToken = localStorage.getItem('token');
        if (regularToken) {
          return regularToken;
        }
      }
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      throw new Error('No authentication token found');
    }
    return token;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getAuthToken();
      const email = userData?.email || user?.email;

      if (!email) {
        toast.error('Please log in to apply');
        navigate('/auth');
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('jobSeekerEmail', email);
      if (resume) {
        formData.append('resume', resume);
      }

      const response = await axios.post(
        'http://localhost:3000/api/applications/apply',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Application submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Only PDF and image files are allowed');
        return;
      }
      setResume(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Submit Application</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Resume (PDF or Image)
            </label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Max file size: 5MB. Accepted formats: PDF, JPEG, PNG
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md 
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Applications Component
const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { userData } = useUser();
  const navigate = useNavigate();

  const getAuthToken = async () => {
    // Try regular authentication token first
    const token = localStorage.getItem('token');
    if (token) {
      return token;
    }

    // If no regular token, try Auth0
    if (isAuthenticated && user) {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "https://job-platform.api",
            scope: "openid profile email offline_access"
          }
        });
        return token;
      } catch (error) {
        console.error("Error getting Auth0 token:", error);
        // If token refresh fails, redirect to login
        navigate('/auth');
        throw new Error("Authentication failed. Please log in again.");
      }
    }

    // If no authentication method works, redirect to auth page
    navigate('/auth');
    throw new Error('No authentication token found. Please log in.');
  };

  const fetchApplications = async () => {
    try {
      if (!userData && !isAuthenticated) {
        toast.error("Please log in to view applications");
        navigate("/auth");
        return;
      }

      const email = userData?.email || user?.email;
      if (!email) {
        toast.error("Please log in to view applications");
        navigate("/auth");
        return;
      }

      const token = await getAuthToken();
      const response = await axios.get(`http://localhost:3000/api/applications/jobseeker/${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Check if response.data has the applications property
      const applicationData = response.data.applications || response.data;
      setApplications(Array.isArray(applicationData) ? applicationData : []);
      
    } catch (error) {
      console.error('Error fetching applications:', error);
      if (!error.message.includes('Please log in')) {
        toast.error('Failed to fetch applications');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [userData, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <h2 className="text-2xl font-bold">Applications</h2>
          <div className="mt-4">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <h2 className="text-2xl font-bold">Applications</h2>
        <div className="mt-4">
          {applications.length === 0 ? (
            <p className="text-gray-600">No applications found.</p>
          ) : (
            applications.map((app) => (
              <ApplicationCard
                key={app._id}
                jobTitle={app.jobId?.jobTitle || 'N/A'}
                company={app.jobId?.company || 'N/A'}
                location={app.jobId?.location || 'N/A'}
                status={app.status}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;