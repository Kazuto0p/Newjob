import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useUser } from '../../UserContext';
import { toast } from 'react-toastify';

const Header = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const { userData } = useUser();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Handle Post Job button click
  const handlePostJobClick = () => {
    if (!isAuthenticated && !userData) {
      toast.error('Please log in to post a job.');
      return;
    }

    const userRole = userData?.role;
    if (userRole === 'recruiter') {
      navigate('/postjob');
    } else {
      toast.error('You need to be a recruiter to post jobs');
    }
  };

  const handleLogout = () => {
    setShowProfileDropdown(false);
    if (isAuthenticated) {
      logout({ returnTo: window.location.origin });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  if (isLoading) {
    return (
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">GetJob</div>
          <div className="text-gray-600">Loading...</div>
        </nav>
      </header>
    );
  }

  const displayName = userData?.username || user?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = userData?.email || user?.email || 'N/A';
  const profilePicture = userData?.profilepicture || user?.picture || '/reshot-icon-user-profile-68ZR2F7VPJ.svg';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary hover:text-primaryHover transition-colors">
          GetJob
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className="bg-primary text-gray-600 px-4 py-2 rounded-lg hover:bg-primaryHover transition-all transform hover:scale-105"
          >
            Home
          </Link>

          {(isAuthenticated || userData) ? (
            <>
              <button
                onClick={handlePostJobClick}
                className="bg-primary text-gray-600 px-4 py-2 rounded-lg hover:bg-primaryHover transition-all transform hover:scale-105"
              >
                Post Job
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown((prev) => !prev)}
                  className="profile-button flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
                >
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{displayName}</span>
                </button>
                {showProfileDropdown && (
                  <div className="profile-dropdown absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <div className="flex flex-col items-center mb-4">
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-12 h-12 rounded-full mb-2"
                      />
                      <p className="font-semibold text-gray-800">{displayName}</p>
                      <p className="text-sm text-gray-600">{displayEmail}</p>
                    </div>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="bg-primary text-gray-600 px-4 py-2 rounded-lg hover:bg-primaryHover transition-all transform hover:scale-105"
              >
                Sign Up
              </button>
              <button
                onClick={() => navigate('/auth?mode=login')}
                className="bg-primary text-gray-600 px-4 py-2 rounded-lg hover:bg-primaryHover transition-all transform hover:scale-105"
              >
                Login
              </button>
            </>
          )}

          {userData?.role === 'admin' && (
            <Link
              to="/admin"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Admin Panel
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-600 hover:text-primary" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary transition-colors"
              onClick={toggleMobileMenu}
            >
              Home
            </Link>
            {(isAuthenticated || userData) ? (
              <>
                <button
                  onClick={() => {
                    handlePostJobClick();
                    toggleMobileMenu();
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primaryHover transition-all"
                >
                  Post Job
                </button>
                <div className="flex flex-col items-start">
                  <button
                    onClick={() => setShowProfileDropdown((prev) => !prev)}
                    className="profile-button flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
                  >
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                    <span>{displayName}</span>
                  </button>
                  {showProfileDropdown && (
                    <div className="profile-dropdown mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <div className="flex flex-col items-center mb-4">
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="w-12 h-12 rounded-full mb-2"
                        />
                        <p className="font-semibold text-gray-800">{displayName}</p>
                        <p className="text-sm text-gray-600">{displayEmail}</p>
                      </div>
                      <hr className="my-2" />
                      <button
                        onClick={() => {
                          handleLogout();
                          toggleMobileMenu();
                        }}
                        className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate('/auth?mode=signup');
                    toggleMobileMenu();
                  }}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => {
                    navigate('/auth?mode=login');
                    toggleMobileMenu();
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primaryHover transition-all"
                >
                  Login
                </button>
              </>
            )}

            {userData?.role === 'admin' && (
              <Link
                to="/admin"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;