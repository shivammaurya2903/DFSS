import React from 'react';
import { Users, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-[#8178F2]" />
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center max-w-3xl mx-auto w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">User Management Not Available</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The user management API is not yet implemented on the backend. This page is a placeholder for future functionality.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link 
            to="/admin" 
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm inline-flex items-center justify-center"
          >
            Back to Dashboard
          </Link>
          <Link 
            to="/admin/activity" 
            className="px-6 py-2.5 bg-[#8178F2] text-white rounded-lg hover:bg-[#6c63e6] transition-colors font-medium text-sm inline-flex items-center justify-center"
          >
            View User Activity Logs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
