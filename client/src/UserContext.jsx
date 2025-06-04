import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { isAuthenticated, isLoading, getAccessTokenSilently, user } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      // Prevent multiple fetches
      if (isLoading || isFetching) return;
      
      setIsFetching(true);
      try {
        let token;
        let email;

        if (isAuthenticated && user?.email) {
          // Auth0 user
          token = await getAccessTokenSilently();
          email = user.email;
        } else {
          // Normal authentication
          token = localStorage.getItem('token');
          email = localStorage.getItem('email');
        }

        if (!token || !email) {
          setUserData(null);
          setIsFetching(false);
          return;
        }

        // Try to fetch existing user
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/users`,
          { email },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const userInfo = res.data.data || res.data;
        console.log("Fetched user data:", userInfo);
        
        if (userInfo) {
          setUserData(userInfo);
          // Check if user needs to set role
          if (!userInfo.role && window.location.pathname !== '/role') {
            navigate('/role');
            setIsFetching(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data || error.message);
        
        // Handle 404 for Auth0 users by creating a new user
        if (isAuthenticated && user?.email && error.response?.status === 404) {
          try {
            console.log("Creating new Auth0 user");
            const signupRes = await axios.post(
              `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/authsignup`,
              { 
                username: user.name || user.email.split("@")[0],
                email: user.email,
                auth0: true
              }
            );
            
            if (signupRes.data) {
              const newUser = signupRes.data.data || signupRes.data;
              setUserData(newUser);
              // Navigate to role selection for new users
              if (!newUser.role && window.location.pathname !== '/role') {
                navigate('/role');
              }
            }
          } catch (signupError) {
            console.error("Auth signup error:", signupError);
            setUserData(null);
          }
        } else {
          setUserData(null);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, isLoading, user?.email]);

  // Clear userData when user logs out
  useEffect(() => {
    // Only clear data if Auth0 is not authenticated AND there's no local token
    if (!isAuthenticated && !isLoading && !localStorage.getItem('token')) {
      setUserData(null);
      localStorage.removeItem('token');
      localStorage.removeItem('email');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <UserContext.Provider value={{ userData, setUserData, isFetching }}>
      {children}
    </UserContext.Provider>
  );
};