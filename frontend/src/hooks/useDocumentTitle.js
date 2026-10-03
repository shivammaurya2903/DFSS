import { useEffect } from 'react';

export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | DFSS` : 'DFSS | Distributed File Storage System';
  }, [title]);
};
