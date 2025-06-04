import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useUser } from '../../UserContext';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useUser();
  const navigate = useNavigate();

  useEffect(() => {

    if (!userData || userData.role !== 'admin') {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }

    fetchData();
  }, [userData, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, jobsRes, applicationsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/users'),
        axios.get('http://localhost:3000/api/jobs'),
        axios.get('http://localhost:3000/api/applications')
      ]);

      setUsers(usersRes.data);
      setJobs(jobsRes.data);
      setApplications(applicationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/jobs/${jobId}`);
      setJobs(jobs.filter(job => job._id !== jobId));
      toast.success('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await axios.put(`http://localhost:3000/api/users/${userId}/role`, { role: newRole });
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const renderUsersTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-3 text-left">Username</th>
            <th className="px-6 py-3 text-left">Email</th>
            <th className="px-6 py-3 text-left">Role</th>
            <th className="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id} className="border-b">
              <td className="px-6 py-4">{user.username}</td>
              <td className="px-6 py-4">{user.email}</td>
              <td className="px-6 py-4">
                <select
                  value={user.role || ''}
                  onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="">No Role</option>
                  <option value="admin">Admin</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="jobSeeker">Job Seeker</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleDeleteUser(user._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJobsTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-3 text-left">Title</th>
            <th className="px-6 py-3 text-left">Company</th>
            <th className="px-6 py-3 text-left">Posted By</th>
            <th className="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job._id} className="border-b">
              <td className="px-6 py-4">{job.jobTitle}</td>
              <td className="px-6 py-4">{job.company}</td>
              <td className="px-6 py-4">{job.postedByEmail}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleDeleteJob(job._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderApplicationsTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-3 text-left">Job Title</th>
            <th className="px-6 py-3 text-left">Applicant</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Applied Date</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(application => (
            <tr key={application._id} className="border-b">
              <td className="px-6 py-4">{application.jobId?.jobTitle || 'N/A'}</td>
              <td className="px-6 py-4">{application.jobSeekerEmail}</td>
              <td className="px-6 py-4">{application.status}</td>
              <td className="px-6 py-4">
                {new Date(application.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="flex mb-6 space-x-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded ${
            activeTab === 'jobs'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Jobs
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded ${
            activeTab === 'applications'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Applications
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'jobs' && renderJobsTab()}
        {activeTab === 'applications' && renderApplicationsTab()}
      </div>
    </div>
  );
};

export default AdminDashboard; 