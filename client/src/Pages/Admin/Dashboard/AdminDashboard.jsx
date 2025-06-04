import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../Layout/AdminLayout';

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        const [usersRes, jobsRes, applicationsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/users', config),
          axios.get('http://localhost:3000/api/admin/jobs', config),
          axios.get('http://localhost:3000/api/admin/applications', config)
        ]);

        setStats({
          totalUsers: usersRes.data.length,
          totalJobs: jobsRes.data.length,
          totalApplications: applicationsRes.data.length,
          recentActivity: applicationsRes.data.slice(0, 5) // Get 5 most recent applications
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
        <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="👥"
          />
          <StatCard
            title="Total Jobs"
            value={stats.totalJobs}
            icon="💼"
          />
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            icon="📝"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Job Title</th>
                  <th className="text-left py-3">Applicant</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((activity) => (
                  <tr key={activity._id} className="border-b">
                    <td className="py-3">{activity.jobId?.jobTitle || 'N/A'}</td>
                    <td className="py-3">{activity.jobSeekerEmail}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        activity.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : activity.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {new Date(activity.createdAt).toLocaleDateString()}
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

export default AdminDashboard; 