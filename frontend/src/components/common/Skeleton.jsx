import React from 'react';

export const SkeletonLine = ({ className = '', width = 'w-full', height = 'h-4' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}></div>
);

export const SkeletonCard = () => (
  <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col gap-4 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <SkeletonLine width="w-3/4" />
        <SkeletonLine width="w-1/2" height="h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonLine />
      <SkeletonLine width="w-5/6" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
      <div className="flex gap-4 animate-pulse">
        <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
        <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
        <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
        <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
          <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
          <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
          <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
          <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-2 w-full animate-pulse">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine key={i} width={i === lines - 1 ? 'w-2/3' : 'w-full'} />
    ))}
  </div>
);
