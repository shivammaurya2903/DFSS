import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen w-full bg-[#F5F7FB] overflow-hidden text-gray-800 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar - fixed on mobile, standard flow on desktop */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out lg:shadow-none h-full`}
      >
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        <Topbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="absolute inset-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
