import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "../../UserContext";

// JobCard Component (aligned with jobSchema)
const JobCard = ({ _id, company, jobTitle, salary, location, experiencelvl, onRemove }) => {
  return (
    <div className="relative border rounded-lg p-6 m-2 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{company}</h3>
          <p className="text-lg font-medium text-gray-700">{jobTitle}</p>
          <p className="text-sm text-gray-500">{salary}</p>
          <p className="text-sm text-gray-500">{location} • {experiencelvl}</p>
        </div>
        <button
          onClick={() => onRemove(_id)}
          className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

// Sidebar Component (unchanged)
const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-white shadow-md">
      <div className="p-4">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          GetJob
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

// SavedJobs Component
const SavedJobs = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const { userData } = useUser();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = async () => {
   
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
        // If token refresh fails, try regular token before redirecting
        const regularToken = localStorage.getItem('token');
        if (regularToken) {
          return regularToken;
        }
        // If no regular token, redirect to login
        await loginWithRedirect();
        throw new Error("Redirecting to login...");
      }
    }
    
    // Try regular authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token is found, redirect to auth page
      navigate('/auth');
      throw new Error('No authentication token found. Redirecting to login...');
    }
    return token;
  };

  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!userData && !isAuthenticated) {
        setError("Please log in to view saved jobs.");
        setLoading(false);
        navigate("/auth?mode=login");
        return;
      }

      const email = userData?.email || user?.email;

      console.log('Fetching saved jobs with:', {
        isAuthenticated,
        userEmail: user?.email,
        localUserEmail: userData?.email,
        finalEmail: email
      });

      if (!email) {
        setError("Please log in to view saved jobs.");
        setLoading(false);
        navigate("/auth?mode=login");
        return;
      }

      try {
        const token = await getAuthToken();
        const res = await axios.post(
          "http://localhost:3000/api/getSavedJobs",
          { email },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Saved jobs response:', res.data);
        
        if (!res.data.savedJobs) {
          console.warn('No savedJobs array in response:', res.data);
          setSavedJobs([]);
        } else {
          setSavedJobs(res.data.savedJobs);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching saved jobs:", {
          response: error.response?.data,
          message: error.message,
          status: error.response?.status
        });
        if (error.message.includes("Redirecting to login")) {
          // Don't show error toast as we're already handling the redirect
          return;
        }
        setError("Failed to fetch saved jobs. Please try again.");
        setLoading(false);
        toast.error("Failed to fetch saved jobs.");
      }
    };

    if (!isLoading) {
      fetchSavedJobs();
    }
  }, [isAuthenticated, user, isLoading, navigate, userData]);

  const handleRemove = async (jobId) => {
    if (!userData && !isAuthenticated) {
      toast.error("Please log in to remove jobs.");
      navigate('/auth');
      return;
    }

    const email = userData?.email || user?.email;

    if (!email) {
      toast.error("Please log in to remove jobs.");
      return;
    }

    try {
      const token = await getAuthToken();
      await axios.post(
        "http://localhost:3000/api/removeSavedJob",
        {
          email,
          jobId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setSavedJobs((prev) => prev.filter((job) => job._id !== jobId));
      toast.success("Job removed successfully.");
    } catch (error) {
      console.error("Error removing job:", error.response?.data || error.message);
      if (error.message.includes("Redirecting to login")) {
        // Don't show error toast as we're already handling the redirect
        return;
      }
      toast.error("Failed to remove job. Please try again.");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <h2 className="text-2xl font-bold">Saved Jobs</h2>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4">
          <h2 className="text-2xl font-bold">Saved Jobs</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <h2 className="text-2xl font-bold">Saved Jobs</h2>
        <div className="mt-4">
          {savedJobs.length === 0 ? (
            <p className="text-gray-600">No saved jobs found.</p>
          ) : (
            savedJobs.map((job) => (
              <JobCard
                key={job._id}
                _id={job._id}
                company={job.company}
                jobTitle={job.jobTitle}
                salary={job.salary}
                location={job.location}
                experiencelvl={job.experiencelvl}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedJobs;