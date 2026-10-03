import React from 'react';
import { Link } from 'react-router-dom';
import { ServerCrash, RefreshCw, Home } from 'lucide-react';

const ServerError = () => {
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ServerCrash className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Distributed Storage is temporarily unavailable</h1>
        <p className="text-gray-500 mb-8 text-sm">
          We're having trouble connecting to the storage system. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button 
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link 
            to="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8178F2] text-white rounded-lg hover:bg-[#6c63e6] transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
