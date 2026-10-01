import React from 'react';
import { Search, Bell, Upload, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Avatar from '../common/Avatar';

const Topbar = ({ toggleSidebar }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={toggleSidebar}>
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search files, folders..." 
            className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="primary" className="text-sm py-1.5 hidden sm:flex">
          <Upload className="w-4 h-4" />
          Upload Files
        </Button>
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <Link to="/profile" className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 pr-3 rounded-full transition-colors">
          <Avatar fallback="AM" />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-gray-700">Alex M.</div>
            <div className="text-xs text-gray-500">Admin</div>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
