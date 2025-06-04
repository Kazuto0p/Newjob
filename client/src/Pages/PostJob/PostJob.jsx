import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../UserContext';
import axios from 'axios';

const PostJob = () => {
  const { isAuthenticated, isLoading, user } = useAuth0();
  const { userData } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    experience: '',
    role: '',
    description: '',
    requirements: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  console.log("Auth0 user:", user);
  console.log("isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
  console.log("API URL:", import.meta.env.VITE_API_URL || 'http://localhost:3000/api');
  console.log("UserContext data:", userData);

  
  if (!isLoading && !userData && !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">Please log in to post jobs.</p>
      </div>
    );
  }

  if (userData?.role !== 'recruiter' && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">Only recruiters can post jobs.</p>
      </div>
    );
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
  };

  const validateFormData = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.salary.trim()) newErrors.salary = 'Salary is required';
    else if (!/^\$?\d+(\.\d+)?(?:\s*-\s*\$?\d+(\.\d+)?)?(?:\/year)?$/.test(formData.salary))
      newErrors.salary = 'Enter a valid salary (e.g., 60000 or $80K - $105K/year)';
    if (!formData.experience.trim()) newErrors.experience = 'Experience level is required';
    if (!formData.role.trim()) newErrors.role = 'Role is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.requirements.trim()) newErrors.requirements = 'Requirements are required';
    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setLoading(true);
    console.log('Form submitted, formData:', formData);

    const validationErrors = validateFormData();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Convert requirements string to array by splitting on newlines and filtering empty lines
      const requirementsArray = formData.requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);

      console.log('Sending request to:', `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/jobs`);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/jobs`,
        {
          jobTitle: formData.title,
          company: formData.company,
          location: formData.location,
          salary: formData.salary,
          experiencelvl: formData.experience,
          role: formData.role,
          jobdescription: formData.description,
          requirements: requirementsArray,
          postedBy: userData?._id || user?.sub,
          postedByEmail: userData?.email || user?.email,
        },
        { 
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Response:', response.data);
      setSuccessMessage('Job posted successfully!');
      setFormData({
        title: '',
        company: '',
        location: '',
        salary: '',
        experience: '',
        role: '',
        description: '',
        requirements: '',
      });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Submission error:', error);
      let errorMessage = 'Error posting job. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check if backend is running on port 3000.';
      } else {
        errorMessage = error.message;
      }
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link to="/">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Post a Job</h1>
      </Link>
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
      {errors.general && <p className="text-red-600 mb-4">{errors.general}</p>}
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
            Job Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="e.g., Software Engineer"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="company" className="block text-gray-700 font-medium mb-2">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="e.g., Tech Corp"
          />
          {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="location" className="block text-gray-700 font-medium mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="e.g., San Francisco, CA"
          />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="salary" className="block text-gray-700 font-medium mb-2">
            Salary
          </label>
          <input
            type="text"
            id="salary"
            name="salary"
            value={formData.salary}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="e.g., 60000 or $80K - $105K/year"
          />
          {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="experience" className="block text-gray-700 font-medium mb-2">
            Experience Level
          </label>
          <select
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="">Select experience level</option>
            <option value="Entry Level">Entry Level</option>
            <option value="Mid Level">Mid Level</option>
            <option value="Senior Level">Senior Level</option>
            <option value="Executive">Executive</option>
          </select>
          {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="role" className="block text-gray-700 font-medium mb-2">
            Role
          </label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
            placeholder="e.g., Full Stack Developer"
          />
          {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
            Job Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 h-32"
            placeholder="Describe the job role and responsibilities..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        <div className="mb-6">
          <label htmlFor="requirements" className="block text-gray-700 font-medium mb-2">
            Requirements
          </label>
          <textarea
            id="requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 h-32"
            placeholder="List the job requirements..."
          />
          {errors.requirements && <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;