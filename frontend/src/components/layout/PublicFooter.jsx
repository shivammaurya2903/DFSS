import React from 'react';
import { Link } from 'react-router-dom';
import { Cloud } from 'lucide-react';

const PublicFooter = () => {
  return (
    <footer className="bg-white border-t border-[#E7E9EF] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex flex-col items-center md:items-start max-w-sm">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Cloud className="h-6 w-6 text-[#8178F2]" />
              <span className="text-lg font-bold text-[#17181C]">DFSS</span>
            </Link>
            <p className="text-[#6F737D] text-sm text-center md:text-left leading-relaxed">
              Distributed storage built for secure file management. Store, organize, access, and share files through a secure distributed platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-12 justify-center md:justify-start">
            <div className="flex flex-col gap-3 text-center md:text-left">
              <h3 className="font-semibold text-[#17181C] text-sm tracking-wider uppercase">Product</h3>
              <Link to="/features" className="text-sm text-[#6F737D] hover:text-[#8178F2]">Features</Link>
              <Link to="/security" className="text-sm text-[#6F737D] hover:text-[#8178F2]">Security</Link>
              <Link to="/how-it-works" className="text-sm text-[#6F737D] hover:text-[#8178F2]">How It Works</Link>
            </div>
            <div className="flex flex-col gap-3 text-center md:text-left">
              <h3 className="font-semibold text-[#17181C] text-sm tracking-wider uppercase">Project</h3>
              <Link to="/faq" className="text-sm text-[#6F737D] hover:text-[#8178F2]">FAQ</Link>
            </div>
            <div className="flex flex-col gap-3 text-center md:text-left">
              <h3 className="font-semibold text-[#17181C] text-sm tracking-wider uppercase">Account</h3>
              <Link to="/login" className="text-sm text-[#6F737D] hover:text-[#8178F2]">Sign In</Link>
              <Link to="/register" className="text-sm text-[#6F737D] hover:text-[#8178F2]">Create Account</Link>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-[#E7E9EF] flex justify-center">
          <p className="text-sm text-[#6F737D]">
            © {new Date().getFullYear()} DFSS. Distributed File Storage System.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
