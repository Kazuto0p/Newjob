import React from 'react';

const Title = () => {
  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold">Job Portal</h2>
      <p className="text-gray-600">Find and apply for job opportunities</p>
      <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Search Jobs
      </button>
    </div>
  );
};

export default Title;