import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, iconColor = 'text-[#8178F2]', trend }) => {
  return (
    <div className="bg-white rounded-xl border border-[#E7E9EF] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#6F737D] mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-[#17181C]">{value}</h3>
          
          {subtitle && (
            <p className="text-sm text-[#6F737D] mt-1">{subtitle}</p>
          )}

          {trend && (
            <div className="flex items-center mt-2">
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value}
              </span>
              <span className="text-sm text-[#6F737D] ml-2">vs last month</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-lg bg-[#F8F9FC] ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
