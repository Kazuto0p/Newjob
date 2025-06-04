import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../../UserContext';
import { toast } from 'react-toastify';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useUser();


  React.useEffect(() => {
    if (!userData || userData.role !== 'admin') {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [userData, navigate]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <Link to="/">
            <h1 className="text-2xl font-bold text-blue-600">Admin Panel</h1>
          </Link>
        </div>
        <nav className="mt-6">
          <Link
            to="/admin"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="mr-3">📊</span>
            Dashboard
          </Link>
          <Link
            to="/admin/users"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/users')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="mr-3">👥</span>
            Users
          </Link>
          <Link
            to="/admin/jobs"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/jobs')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="mr-3">💼</span>
            Jobs
          </Link>
          <Link
            to="/admin/applications"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/applications')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="mr-3">📝</span>
            Applications
          </Link>
          <Link
            to="/admin/reports"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/reports')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="mr-3">⚠️</span>
            Reports
          </Link>
        </nav>
      </div>


      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 