import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">
          You don't have permission to view this page.
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#8178F2] text-white rounded-lg hover:bg-[#6c63e6] transition-colors font-medium w-full"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
};

export default Forbidden;
