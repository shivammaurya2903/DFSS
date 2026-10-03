import React from 'react';
import PageContainer from '../../components/layout/PageContainer';
import { Database, FlaskConical, FileText } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const AdminStorage = () => {
  useDocumentTitle('Storage Management - Admin');
  return (
    <PageContainer>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-2xl mx-auto mt-10 shadow-sm">
        <Database className="w-12 h-12 text-[#8178F2] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Advanced Storage Management</h1>
        <p className="text-gray-500 mb-6">Deep storage analytics and pool management are currently being rolled out.</p>
      </div>
    </PageContainer>
  );
};

export const AdminExperiments = () => {
  useDocumentTitle('Experiments - Admin');
  return (
    <PageContainer>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-2xl mx-auto mt-10 shadow-sm">
        <FlaskConical className="w-12 h-12 text-[#8178F2] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Research Experiments</h1>
        <p className="text-gray-500 mb-6">Placement strategy A/B testing and algorithmic experiments interface.</p>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-[#8178F2] text-sm font-medium">
          Coming Soon
        </div>
      </div>
    </PageContainer>
  );
};

export const AdminAudit = () => {
  useDocumentTitle('System Audit - Admin');
  return (
    <PageContainer>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-2xl mx-auto mt-10 shadow-sm">
        <FileText className="w-12 h-12 text-[#8178F2] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Security Audit Logs</h1>
        <p className="text-gray-500 mb-6">Comprehensive system access and mutation audit trails.</p>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-[#8178F2] text-sm font-medium">
          Coming Soon
        </div>
      </div>
    </PageContainer>
  );
};
