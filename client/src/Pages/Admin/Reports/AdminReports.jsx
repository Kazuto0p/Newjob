import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth0 } from "@auth0/auth0-react";
import AdminLayout from '../Layout/AdminLayout';
import { useUser } from '../../../UserContext';
import { useNavigate } from 'react-router-dom';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
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
        // Fallback to regular token
        const regularToken = localStorage.getItem('token');
        if (regularToken) {
          return regularToken;
        }
      }
    }
    
    // Try regular authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      throw new Error('No authentication token found');
    }
    return token;
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = await getAuthToken();
      const response = await axios.get('http://localhost:3000/api/reports', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setReports(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus, adminNotes) => {
    try {
      const token = await getAuthToken();
      await axios.patch(
        `http://localhost:3000/api/reports/${reportId}`,
        { status: newStatus, adminNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Report status updated successfully');
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Job Reports</h1>
          <div className="text-center">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Job Reports</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{report.jobTitle}</div>
                      <div className="text-sm text-gray-500">{report.company}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{report.reportedBy}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{report.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(report.status)}`}>
                        {report.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <select
                        className="mr-2 rounded border-gray-300"
                        value={report.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(report._id, e.target.value, report.adminNotes)}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button
                        onClick={() => {
                          const notes = prompt('Enter admin notes:', report.adminNotes || '');
                          if (notes !== null) {
                            handleStatusUpdate(report._id, report.status || 'pending', notes);
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Add Notes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports; 