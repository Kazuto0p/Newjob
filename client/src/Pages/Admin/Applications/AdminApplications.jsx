import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminLayout from '../Layout/AdminLayout';
import { Link } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from '../../../UserContext';
import { useNavigate } from 'react-router-dom';

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { userData } = useUser();
  const navigate = useNavigate();

  const getAuthToken = async () => {
    // If using Auth0, always try to get a fresh token first
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
        // If Auth0 token fails, try stored token
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          return storedToken;
        }
        // If no stored token, redirect to auth
        navigate('/auth');
        throw new Error("Authentication failed. Please log in again.");
      }
    }
    
    // If not using Auth0, try regular token
    const token = localStorage.getItem('token');
    if (token) {
      return token;
    }
    
    // If no token found, redirect to auth page
    navigate('/auth');
    throw new Error('No authentication token found. Please log in.');
  };

  const fetchApplications = async () => {
    try {
      // Check if user is admin
      if (!userData?.role || userData.role !== 'admin') {
        toast.error('Access denied. Only administrators can access this page.');
        navigate('/');
        return;
      }

      const token = await getAuthToken();
      const response = await axios.get('http://localhost:3000/api/admin/applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Only administrators can access this page.');
        navigate('/');
      } else {
        toast.error('Failed to fetch applications');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [userData]); // Re-fetch when userData changes

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-8">Application Management</h1>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {application.jobId?.jobTitle || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.jobId?.company || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {application.jobSeekerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminApplications; 