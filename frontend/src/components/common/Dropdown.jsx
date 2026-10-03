import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dropdown = ({ trigger, items = [], align = 'left', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const alignmentClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef} onKeyDown={handleKeyDown}>
      <div onClick={toggleDropdown} className="cursor-pointer" aria-haspopup="true" aria-expanded={isOpen}>
        {trigger}
      </div>

      {isOpen && (
        <div 
          className={`absolute z-50 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none fade-in ${alignmentClass}`}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={`div-${index}`} className="my-1 border-t border-gray-100" />;
              }

              const Icon = item.icon;
              const content = (
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </div>
              );

              const itemClasses = `block w-full text-left px-4 py-2 text-sm transition-colors ${
                item.danger 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`;

              if (item.href) {
                return (
                  <Link
                    key={index}
                    to={item.href}
                    className={itemClasses}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={index}
                  onClick={(e) => {
                    if (item.onClick) item.onClick(e);
                    setIsOpen(false);
                  }}
                  className={itemClasses}
                  role="menuitem"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
