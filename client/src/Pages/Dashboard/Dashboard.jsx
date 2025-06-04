import React from 'react';
import HomePage from '../Home/Home';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-white shadow-md">
      <div className="p-4">
        <Link to="/"><h1 className="text-2xl font-bold text-blue-600">GetJob</h1></Link>
        
       
      </div>
      <nav className="mt-4">
        <Link to="/dashboard" className="flex items-center p-4 text-gray-600 hover:text-blue-600">
          <span className="mr-2">🏠</span> Dashboard
        </Link>
        <Link to="/savedjobs" className="flex items-center p-4 text-gray-600 hover:text-blue-600">
          <span className="mr-2">💼</span> Saved Jobs
        </Link>
        <Link to="/profile" className="flex items-center p-4 text-gray-600 hover:text-blue-600">
          <span className="mr-2">👤</span> Profile
        </Link>
      </nav>
    </div>
  );
};

const StatCard = ({ title, value, date }) => {
  return (
    <div className="border rounded p-4 m-2">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-gray-600">{value}</p>
      <p className="text-gray-600">{date}</p>
    </div>
  );
};

const Dashboard = () => {
  const stats = [
    { title: "Resume", value: "Uploaded for 5 reviewed jobs", date: "1st Apr" },
    { title: "Applied Jobs", value: "Applied for Product at AVEGE", date: "5th Apr" },
    { title: "Saved Jobs", value: "Candidate 1 to saved jobs", date: "5th Apr" },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="mt-4">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              date={stat.date}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;