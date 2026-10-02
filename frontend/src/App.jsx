import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import FileDetails from './pages/FileDetails';
import FileViewer from './pages/FileViewer';
import Shared from './pages/Shared';
import Storage from './pages/Storage';
import Activity from './pages/Activity';
import Favorites from './pages/Favorites';
import Recent from './pages/Recent';
import Expired from './pages/Expired';
import NodeDetails from './pages/NodeDetails';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="shared" element={<Shared />} />
            <Route path="files" element={<Files />} />
            <Route path="files/:fileId" element={<FileDetails />} />
            <Route path="files/:fileId/view" element={<FileViewer />} />
            <Route path="storage" element={<Storage />} />
            <Route path="storage/nodes/:nodeId" element={<NodeDetails />} />
            <Route path="activity" element={<Activity />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="recent" element={<Recent />} />
            <Route path="expired" element={<Expired />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
