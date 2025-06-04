import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "../../UserContext";

const Navigation = () => {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const { userData, setUserData } = useUser();
  const navigate = useNavigate();

  console.log("Navigation userData:", userData);
  console.log("userData role:", userData?.role);

  const handleLogout = () => {
    if (isAuthenticated) {
      // Auth0 logout
      logout({ returnTo: window.location.origin });
    } else {
      // Normal logout
      localStorage.removeItem('token');
      setUserData(null);
      navigate('/');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated && !userData) {
    return <button onClick={() => loginWithRedirect()}>Login</button>;
  }

  return (
    <div className="flex space-x-4 p-4 border-b">
      <Link to="/" className="text-blue-600 border-b-2 border-blue-600 pb-1">
        Home
      </Link>
      {/* <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">
        Dashboard
      </Link> */}
      <Link to="/applications" className="text-gray-600 hover:text-blue-600">
        Applications
      </Link>
      <Link to="/savedjobs" className="text-gray-600 hover:text-blue-600">
        Saved Jobs
      </Link>
      {userData?.role === "recruiter" && (
        <Link to="/recruiter-portal" className="text-gray-600 hover:text-blue-600">
          Recruiter Portal
        </Link>
      )}
      <button
        onClick={handleLogout}
        className="ml-auto text-red-600 hover:text-red-700"
      >
        Logout
      </button>
    </div>
  );
};

export default Navigation;