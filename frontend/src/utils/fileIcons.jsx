import React from 'react';
import { FileText, Image, Video, Music, Archive, File as FileIcon, Code } from 'lucide-react';
import { getFileTypeCategory } from './formatters';

export const getFileIconComponent = (mimeType, size = 'md') => {
  const category = getFileTypeCategory(mimeType);
  
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const className = `${sizeClasses[size]} shrink-0`;

  switch (category) {
    case 'image':
      return <Image className={`${className} text-blue-500`} />;
    case 'video':
      return <Video className={`${className} text-purple-500`} />;
    case 'audio':
      return <Music className={`${className} text-yellow-500`} />;
    case 'pdf':
    case 'text':
      return <FileText className={`${className} text-red-500`} />;
    case 'archive':
      return <Archive className={`${className} text-orange-500`} />;
    case 'code':
      return <Code className={`${className} text-green-500`} />;
    case 'other':
    default:
      return <FileIcon className={`${className} text-gray-400`} />;
  }
};

export const getFileColorClass = (mimeType) => {
  const category = getFileTypeCategory(mimeType);
  
  switch (category) {
    case 'image':
      return 'bg-blue-50 text-blue-600';
    case 'video':
      return 'bg-purple-50 text-purple-600';
    case 'audio':
      return 'bg-yellow-50 text-yellow-600';
    case 'pdf':
    case 'text':
      return 'bg-red-50 text-red-600';
    case 'archive':
      return 'bg-orange-50 text-orange-600';
    case 'code':
      return 'bg-green-50 text-green-600';
    case 'other':
    default:
      return 'bg-gray-50 text-gray-600';
  }
};
