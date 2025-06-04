import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../UserContext";

const api = axios.create({
  baseURL: 'http://localhost:3000'
});

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_MISSING') {
        localStorage.removeItem('token');
        window.location.href = '/auth';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

function RecruiterPortal() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const { userData } = useUser();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  const email = userData?.email || (isAuthenticated ? user?.email : null);
  const role = userData?.role;

  const getAuthToken = async () => {
    console.log('Getting auth token:', {
      isAuthenticated,
      hasUser: !!user,
      isLoading,
      hasStoredToken: !!localStorage.getItem('token')
    });

    if (isAuthenticated && user) {
      try {
        console.log('Attempting to get fresh Auth0 token');
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: "https://job-platform.api",
            scope: "openid profile email offline_access"
          }
        });
        console.log('Successfully got fresh Auth0 token');
        localStorage.setItem('token', token);
        return token;
      } catch (error) {
        console.error("Error getting Auth0 token:", {
          message: error.message,
          stack: error.stack
        });
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          console.log('Using stored token as fallback');
          return storedToken;
        }
        console.log('No stored token available, redirecting to auth');
        navigate('/auth');
        throw new Error("Authentication failed. Please log in again.");
      }
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Using stored regular token');
      return token;
    }
    
    console.log('No token available, redirecting to auth');
    navigate('/auth');
    throw new Error('No authentication token found. Please log in.');
  };

  useEffect(() => {
    if (isLoading) return;

    if (!email) {
      toast.error("Please log in to continue.");
      return navigate("/auth");
    }

    if (role !== "recruiter") {
      toast.error("Access denied. Only recruiters can access this page.");
      return navigate("/");
    }

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = await getAuthToken();
        
        if (!token) {
          console.error('No token available');
          toast.error("Authentication required");
          navigate("/auth");
          return;
        }

        console.log('Making API request with token:', {
          tokenExists: !!token,
          tokenPrefix: token ? token.substring(0, 20) + '...' : null,
          email,
          role
        });

        const res = await api.get(
          `/api/applications/recruiter/${email}`,
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        console.log('API Response:', {
          status: res.status,
          dataExists: !!res.data,
          applicationsCount: res.data?.applications?.length,
          data: res.data
        });
        
        setApplications(res.data.applications || []);
      } catch (error) {
        console.error("Error fetching applications:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          stack: error.stack
        });
        
        if (error.response?.status === 401) {
          const errorMessage = error.response?.data?.message || "Session expired. Please log in again.";
          const errorCode = error.response?.data?.code;
          
          console.log('Authentication error:', {
            code: errorCode,
            message: errorMessage
          });
          
          toast.error(errorMessage);
          
          if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID') {
            localStorage.removeItem('token');
            navigate("/auth");
          }
        } else if (error.response?.status === 403) {
          toast.error("Access denied. Only recruiters can access this page.");
          navigate("/");
        } else {
          toast.error("Failed to fetch applications. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [email, isAuthenticated, isLoading, role]);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        toast.error("Authentication required");
        navigate("/auth");
        return;
      }

      await api.patch(
        `/api/applications/${applicationId}`,
        { status: newStatus },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      toast.success("Application status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || "Session expired. Please log in again.";
        toast.error(errorMessage);
        navigate("/auth");
      } else {
        toast.error("Failed to update application status");
      }
    }
  };

  const handleViewResume = async (applicationId) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        toast.error("Authentication required");
        navigate("/auth");
        return;
      }

      const response = await api.get(
        `/api/applications/${applicationId}/resume`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'  // Important: Tell axios to expect binary data
        }
      );

      // Create a blob URL from the response data
      const file = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');

      // Clean up the blob URL after opening
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 100);
    } catch (error) {
      console.error('Error viewing resume:', error);
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || "Session expired. Please log in again.";
        toast.error(errorMessage);
        navigate("/auth");
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || 'Resume not found');
      } else {
        toast.error('Failed to view resume');
      }
    }
  };

  const handleDownloadResume = async (applicationId) => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        toast.error("Authentication required");
        navigate("/auth");
        return;
      }

      const response = await api.get(
        `/api/applications/${applicationId}/resume`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'  // Important: Tell axios to expect binary data
        }
      );

      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'resume';

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Resume downloaded successfully');
    } catch (error) {
      console.error('Error downloading resume:', error);
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || "Session expired. Please log in again.";
        toast.error(errorMessage);
        navigate("/auth");
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || 'Resume not found');
      } else {
        toast.error('Failed to download resume');
      }
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Applications</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No applications found
                </td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr key={application._id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {application.jobId?.jobTitle}
                    </div>
                    <div className="text-sm text-gray-500">
                      {application.jobId?.company}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {application.jobSeekerEmail}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      application.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {application.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusUpdate(application._id, e.target.value)}
                      className="rounded border-gray-300 text-sm"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accept</option>
                      <option value="Rejected">Reject</option>
                    </select>
                    {application.hasResume && (
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleDownloadResume(application._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Resume
                        </button>
                        <button
                          onClick={() => handleViewResume(application._id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Resume
                        </button>
                      </div>
                    )}
                    {!application.hasResume && (
                      <span className="text-sm text-gray-500 italic">No resume attached</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecruiterPortal;