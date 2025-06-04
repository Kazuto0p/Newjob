import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Facebook, Twitter, Instagram } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useUser } from '../../UserContext';

const AuthPage = () => {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading, error: auth0Error, getAccessTokenSilently } = useAuth0();
  const { setUserData } = useUser();
  const [isSignIn, setIsSignIn] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Auth0 errors
  useEffect(() => {
    if (auth0Error) {
      setError(auth0Error.message || 'Authentication error');
    }
  }, [auth0Error]);

  // Redirect after successful Auth0 login
  useEffect(() => {
    const handleGoogleAuth = async () => {
      if (isAuthenticated && user && !isLoading) {
        try {
          // Try to fetch user first
          const token = await getAccessTokenSilently();
          // Store the Auth0 token in localStorage
          localStorage.setItem('token', token);
          
          try {
            const userRes = await axios.post(
              `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/users`,
              { email: user.email },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const userData = userRes.data.data || userRes.data;
            setUserData(userData);
            
            // If user exists but no role, go to role selection
            if (!userData.role) {
              navigate('/role');
            } else {
              navigate('/');
            }
          } catch (error) {
            // If user doesn't exist, create them
            if (error.response?.status === 404) {
              const res = await axios.post(
                `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/authsignup`,
                {
                  email: user.email,
                  username: user.name || user.email.split('@')[0],
                  auth0: true
                }
              );

              console.log('Auth signup response:', res);
              
              if (res.status === 201) {
                setUserData(res.data.data);
                navigate('/role');
              }
            } else {
              throw error;
            }
          }
        } catch (err) {
          console.error('Error during Google post-auth check:', err);
          setError('Error checking user status');
        }
      }
    };

    handleGoogleAuth();
  }, [isAuthenticated, isLoading, user, navigate]);

  // Toggle between sign-in and sign-up
  const toggle = () => {
    setIsSignIn((prev) => !prev);
    setError('');
    setSuccess('');
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form validation
  const validateForm = (isSignIn) => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (!isSignIn && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!isSignIn && !formData.username) {
      setError('Username is required');
      return false;
    }
    return true;
  };

  // Handle sign-up form submission
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm(false)) return;
    setIsFormLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/Signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      }); 
      localStorage.setItem("email", formData.email);
      console.log(response);
      localStorage.setItem("token", response.data.token);
      
      // Set user data in context
      if (response.data.data) {
        setUserData(response.data.data);
      }
      
      setSuccess(response.data.message);
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
      // Always navigate to role page for new users
      navigate('/role');
    } catch (err) {
      setError(err.response?.data?.message || 'Error signing up');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle sign-in form submission
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm(true)) return;
    setIsFormLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/login', {
        email: formData.email,
        password: formData.password,
      });
      setSuccess(response.data.message);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('email', formData.email);
        
        // Fetch user data after successful login
        const userResponse = await axios.post('http://localhost:3000/api/users', {
          email: formData.email
        }, {
          headers: {
            Authorization: `Bearer ${response.data.token}`
          }
        });
        const userData = userResponse.data.data || userResponse.data;
        setUserData(userData);
        
        // Navigate based on user state
        if (!userData.role) {
          navigate('/role');
        } else {
          navigate('/');
        }
      }
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error signing in');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle social sign-ins
  const handleGoogleSignIn = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'google-oauth2',
          redirect_uri: 'http://localhost:5173',
          screen_hint: 'login',
        },
      });
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setError(`Failed to initiate Google sign-in: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'facebook',
          redirect_uri: 'http://localhost:5173',
          screen_hint: 'login',
        },
      });
    } catch (error) {
      setError('Failed to initiate Facebook sign-in. Please try again.');
    }
  };

  const handleTwitterSignIn = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'twitter',
          redirect_uri: 'http://localhost:5173',
          screen_hint: 'login',
        },
      });
    } catch (error) {
      setError('Failed to initiate Twitter sign-in. Please try again.');
    }
  };

  const handleInstagramSignIn = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: 'instagram',
          redirect_uri: 'http://localhost:5173',
          screen_hint: 'login',
        },
      });
    } catch (error) {
      setError('Failed to initiate Instagram sign-in. Please try again.');
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSignIn(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative min-h-screen overflow-hidden font-['Poppins'] ${isSignIn ? 'sign-in' : 'sign-up'}`}>
      {isAuthenticated && (
        <div className="absolute top-4 right-4 flex items-center space-x-4 z-30">
          <p className="text-white">Welcome, {user.name}</p>
          <button
            onClick={() => logout({ returnTo: 'http://localhost:5173' })}
            className="text-gray-200 hover:text-red-500"
          >
            Logout
          </button>
        </div>
      )}

      <div
        className={`absolute top-0 right-0 h-screen w-[300vw] transition-all duration-1000 ease-in-out z-10 shadow-2xl ${
          isSignIn ? 'translate-x-0 right-1/2' : 'translate-x-full right-1/2'
        } bg-gradient-to-br from-[#4EA685] to-[#57B894] rounded-tl-[max(50vw,50vh)] rounded-br-[max(50vw,50vh)]`}
        style={{ transform: isSignIn ? 'translate(0, 0)' : 'translate(100%, 0)' }}
      />

      <div className="flex flex-wrap h-screen">
        <div
          className={`w-1/2 flex items-center justify-center text-center flex-col transition-transform duration-500 ease-in-out z-20 
          md:w-1/2 md:static md:bg-transparent md:rounded-none md:p-0
          ${!isSignIn ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          absolute bottom-0 w-full p-8 bg-white rounded-t-3xl`}
        >
          <div className="md:hidden mb-4 w-full">
            <h3 className="text-2xl font-bold text-gray-800">Sign Up</h3>
            <div className="w-16 h-1 bg-[#4EA685] mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="w-full max-w-md flex items-center justify-center">
            <div
              className={`p-4 bg-white rounded-3xl shadow-2xl transform transition-all duration-500 ease-in-out ${
                !isSignIn ? 'scale-100 delay-1000' : 'scale-0'
              } w-full md:shadow-none md:p-0 md:rounded-none`}
            >
              {error && !isSignIn && <p className="text-red-500 mb-4">{error}</p>}
              {success && !isSignIn && <p className="text-green-500 mb-4">{success}</p>}
              <form onSubmit={handleSignUp}>
                <div className="relative mb-4">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 bg-gray-100 rounded-lg border-2 border-white focus:border-[#4EA685] outline-none text-gray-700"
                  />
                </div>
                <div className="relative mb-4">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 bg-gray-100 rounded-lg border-2 border-white focus:border-[#4EA685] outline-none text-gray-700"
                  />
                </div>
                <div className="relative mb-4">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 bg-gray-100 rounded-lg border-2 border-white focus:border-[#4EA685] outline-none text-gray-700"
                  />
                </div>
                <div className="relative mb-4">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 bg-gray-100 rounded-lg border-2 border-white focus:border-[#4EA685] outline-none text-gray-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isFormLoading}
                  className={`w-full py-3 bg-[#4EA685] text-white rounded-lg hover:bg-[#57B894] transition-colors text-lg font-medium cursor-pointer ${
                    isFormLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isFormLoading ? 'Loading...' : 'Sign up'}
                </button>
              </form>
              <label>OR</label>
              <button
                onClick={handleGoogleSignIn}
                disabled={isFormLoading}
                className={`w-full py-3 mt-3 bg-white text-gray-700 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-lg font-medium cursor-pointer flex items-center justify-center gap-3 ${
                  isFormLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <p className="mt-4 text-xs text-gray-600">
                <span>Already have an account? </span>
                <b onClick={toggle} className="text-[#4EA685] cursor-pointer hover:underline">
                  Sign in here
                </b>
              </p>
            </div>
          </div>
          <div
            className={`mt-8 p-4 bg-white rounded-3xl shadow-2xl transform transition-all duration-500 ease-in-out ${
              !isSignIn ? 'scale-100 delay-[1200ms]' : 'scale-0'
            } w-full max-w-md social-container md:shadow-2xl`}
          >
            <div className="flex justify-center space-x-2">
              <div
                onClick={handleFacebookSignIn}
                className={`bg-[#4267B2] text-white p-3 rounded-lg cursor-pointer transform transition-all duration-500 ease-in-out hover:scale-110 ${
                  !isSignIn ? 'scale-100 delay-[1400ms]' : 'scale-0'
                }`}
              >
                <Facebook className="w-6 h-6" />
              </div>
              <div
                onClick={handleGoogleSignIn}
                className={`bg-[#DB4437] text-white p-3 rounded-lg cursor-pointer transform transition-all duration-500 ease-in-out hover:scale-110 ${
                  !isSignIn ? 'scale-100 delay-[1600ms]' : 'scale-0'
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div
                onClick={handleTwitterSignIn}
                className={`bg-[#1DA1F2] text-white p-3 rounded-lg cursor-pointer transform transition-all duration-500 ease-in-out hover:scale-110 ${
                  !isSignIn ? 'scale-100 delay-[1800ms]' : 'scale-0'
                }`}
              >
                <Twitter className="w-6 h-6" />
              </div>
              <div
                onClick={handleInstagramSignIn}
                className={`bg-[#E1306C] text-white p-3 rounded-lg cursor-pointer transform transition-all duration-500 ease-in-out hover:scale-110 ${
                  !isSignIn ? 'scale-100 delay-[2000ms]' : 'scale-0'
                }`}
              >
                <Instagram className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`w-1/2 flex items-center justify-center text-center flex-col transition-transform duration-500 ease-in-out z-20
          md:w-1/2 md:static md:bg-transparent md:rounded-none md:p-0
          ${isSignIn ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          absolute bottom-0 w-full p-8 bg-white rounded-t-3xl`}
        >
          <div className="md:hidden mb-4 w-full">
            <h3 className="text-2xl font-bold text-gray-800">Login</h3>
            <div className="w-16 h-1 bg-[#4EA685] mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="w-full max-w-md flex items-center justify-center">
            <div
              className={`p-4 bg-white rounded-3xl shadow-2xl transform transition-all duration-500 ease-in-out ${
                isSignIn ? 'scale-100 delay-1000' : 'scale-0'
              } w-full md:shadow-none md:p-0 md:rounded-none`}
            >
              {error && isSignIn && <p className="text-red-500 mb-4">{error}</p>}
              {success && isSignIn && <p className="text-green-500 mb-4">{success}</p>}
              <form onSubmit={handleSignIn}>
                <div className="relative mb-4">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 bg-gray-100 rounded-lg border-2 border-white focus:border-[#4EA685] outline-none text-gray-700"
                  />
                </div>
                <div className="relative mb-4">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-6 h-6" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-4 pl-12 bg-gray-100 rounded-lg border-2 border-white focus:border-[#4EA685] outline-none text-gray-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isFormLoading}
                  className={`w-full py-3 bg-[#4EA685] text-white rounded-lg hover:bg-[#57B894] transition-colors text-lg font-medium cursor-pointer ${
                    isFormLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isFormLoading ? 'Loading...' : 'Sign in'}
                </button>
              </form>
              <label>OR</label>
              <button
                onClick={handleGoogleSignIn}
                disabled={isFormLoading}
                className={`w-full py-3 mt-3 bg-white text-gray-700 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-lg font-medium cursor-pointer flex items-center justify-center gap-3 ${
                  isFormLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <p className="mt-4 text-xs text-gray-600">
                <b className="text-[#4EA685] cursor-pointer hover:underline">Forgot password?</b>
              </p>
              <p className="mt-2 text-xs text-gray-600">
                <span>Don't have an account? </span>
                <b onClick={toggle} className="text-[#4EA685] cursor-pointer hover:underline">
                  Sign up here
                </b>
              </p>
            </div>
          </div>
          <div
            className={`mt-8 p-4 bg-white rounded-3xl shadow-2xl transform transition-all duration-500 ease-in-out ${
              isSignIn ? 'scale-100 delay-[1200ms]' : 'scale-0'
            } w-full max-w-md social-container md:shadow-2xl`}
          >
            <div className="flex justify-center space-x-2">
              <div
                onClick={handleFacebookSignIn}
                className={`bg-[#4267B2] text-white p-3 rounded-lg cursor-pointer transform transition-all duration-500 ease-in-out hover:scale-110 ${
                  isSignIn ? 'scale-100 delay-[1400ms]' : 'scale-0'
                }`}
              >
                <Facebook className="w-6 h-6" />
              </div>
              <div
                onClick={handleGoogleSignIn}
                className={`bg-[#DB4437] text-white p-3 rounded-lg cursor-pointer transform transition-all duration-500 ease-in-out hover:scale-110 ${
                  isSignIn ? 'scale-100 delay-[1600ms]' : 'scale-0'
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div
                onClick={handleTwitterSignIn}
                className={`bg-[#1DA1F2] text-white p-3 rounded-lg cursor-pointer transform transition-all duration-500 ease-in-out hover:scale-110 ${
                  isSignIn ? 'scale-100 delay-[1800ms]' : 'scale-0'
                }`}
              >
                <Twitter className="w-6 h-6" />
              </div>
              <div
                onClick={handleInstagramSignIn}
                className={`bg-[#E1306C] text-white p-3 rounded-lg cursor-pointer transform transition-all duration-500 ease-in-out hover:scale-110 ${
                  isSignIn ? 'scale-100 delay-[2000ms]' : 'scale-0'
                }`}
              >
                <Instagram className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full flex pointer-events-none z-20 h-full">
        <div className="w-1/2 flex items-center justify-center text-center">
          <div className="text-white mx-16">
            <h2
              className={`text-6xl font-extrabold mb-8 transform transition-all duration-1000 ease-in-out ${
                isSignIn ? 'translate-x-0' : '-translate-x-[250%]'
              }`}
            >
              Welcome
            </h2>
            <p
              className={`font-semibold text-lg transform transition-all duration-1000 ease-in-out delay-200 content-text-p ${
                isSignIn ? 'translate-x-0' : '-translate-x-[250%]'
              }`}
            >
              Enter your personal details and start your journey with us
            </p>
          </div>
        </div>

        <div className="w-1/2 flex items-center justify-center text-center">
          <div className="text-white mx-16">
            <div
              className={`mb-8 transform transition-all duration-1000 ease-in-out delay-400 ${
                !isSignIn ? 'translate-x-0' : 'translate-x-[250%]'
              }`}
            >
              <div className="w-[30vw] h-64 bg-white bg-opacity-20 rounded-3xl mx-auto flex items-center justify-center backdrop-blur-sm hidden md:flex">
                <div className="text-8xl opacity-50">🚀</div>
              </div>
            </div>
            <h2
              className={`text-6xl font-extrabold mb-8 transform transition-all duration-500 ease-in-out ${
                !isSignIn ? 'translate-x-0' : 'translate-x-[250%]'
              }`}
            >
              Join with us
            </h2>
            <p
              className={`font-semibold text-lg transform transition-all duration-1000 ease-in-out delay-200 content-text-p ${
                !isSignIn ? 'translate-x-0' : 'translate-x-[250%]'
              }`}
            >
              Sign up and discover a great amount of new opportunities
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media only screen and (max-width: 768px) {
          .bg-gradient-to-br {
            height: 100vh !important;
            border-radius: 0 !important;
            z-index: 0 !important;
            transform: none !important;
            right: 0 !important;
            width: 100vw !important;
          }
          .text-6xl {
            font-size: 2.5rem !important;
            margin: 0.5rem !important;
          }
          .mx-16 {
            margin-left: 1rem !important;
            margin-right: 1rem !important;
          }
          .w-[30vw] {
            width: 80vw !important;
            height: 200px !important;
          }
          .content-text-p {
            display: none !important;
          }
          .absolute.top-0.left-0 {
            align-items: flex-start !important;
          }
          .absolute.top-0.left-0 .w-1/2 {
            background-color: transparent !important;
            transform: translateY(0) !important;
          }
          .social-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        @media only screen and (max-width: 425px) {
          .text-6xl {
            font-size: 2rem !important;
          }
          .w-[30vw] {
            height: 150px !important;
          }
          .text-8xl {
            font-size: 4rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
