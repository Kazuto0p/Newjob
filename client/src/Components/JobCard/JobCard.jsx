import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "../../UserContext";
import { useNavigate } from "react-router-dom";

const JobCard = ({ _id, company, jobTitle, salary, location, experiencelvl, role }) => {
  const { user, isAuthenticated, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const { userData } = useUser();
  const navigate = useNavigate();

  const getAuthToken = async () => {
    // First try to get Auth0 token if authenticated with Auth0
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

  const handleSaveJob = async () => {
    if (!userData && !isAuthenticated) {
      toast.info("Please log in to save jobs");
      navigate('/auth');
      return;
    }

    try {
      const token = await getAuthToken();
      const res = await axios.post(
        "http://localhost:3000/api/savedJobs",
        {
          email: userData?.email || user?.email,
          jobId: _id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Job Saved:", res.data);
      toast.success("Job saved successfully!");
    } catch (error) {
      console.error("Error saving job:", error);
      if (error.message.includes("Missing Refresh Token") || error.message.includes("No authentication token found")) {
        toast.error("Please log in again to continue");
        navigate('/auth');
      } else {
        toast.error("Failed to save job. Please try again.");
      }
    }
  };

  const handleApplyJob = async () => {
    // Check if user is authenticated through either method
    if (!userData && !isAuthenticated) {
      toast.info("Please log in to apply for jobs");
      navigate('/auth');
      return;
    }

    try {
      // Check if user has a role set
      if (!userData?.role) {
        toast.info("Please set your role before applying for jobs");
        navigate('/role');
        return;
      }

      // Check if user is a job seeker
      if (userData.role !== "jobSeeker") {
        toast.error("Only job seekers can apply for jobs");
        return;
      }

      const token = await getAuthToken();
      
      // Log authentication info for debugging
      console.log('Authentication info:', {
        isAuth0: isAuthenticated,
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 10) + '...' : null,
        userRole: userData?.role,
        userEmail: userData?.email || user?.email
      });

      const res = await axios.post(
        "http://localhost:3000/api/applications/apply",
        {
          jobId: _id,
          jobSeekerEmail: userData?.email || user?.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Job Application Submitted:", res.data);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Error applying for job:", error);
      
      // Handle specific error cases
      if (error.message.includes("Redirecting to login")) {
        // Don't show error toast as we're already handling the redirect
        return;
      }
      
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
        // Clear any existing tokens
        localStorage.removeItem('token');
        if (isAuthenticated) {
          await loginWithRedirect();
        } else {
          navigate('/auth');
        }
        return;
      }

      const errorMessage = error.response?.data?.message || "Failed to apply for job. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="border rounded-lg p-6 m-2 flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{company}</h3>
        <p className="text-lg font-medium text-gray-700">{jobTitle}</p>
        <p className="text-sm text-gray-500">{salary}</p>
        <p className="text-sm text-gray-500">
          {location} • {experiencelvl}
        </p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={handleSaveJob}
          className="border border-gray-300 px-4 py-2 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleApplyJob}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default JobCard;