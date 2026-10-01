import React, { useState } from 'react';
import { Folder, MoreHorizontal, LayoutGrid, List, File, FileText, Image as ImageIcon, CheckSquare, Settings, Share2, Info, X } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { folders, files } from '../utils/mockData';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('list');
  const [selectedFile, setSelectedFile] = useState(null);

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF': return <FileText className="text-red-500 w-8 h-8" />;
      case 'Excel': return <FileText className="text-green-500 w-8 h-8" />;
      case 'Figma': return <ImageIcon className="text-purple-500 w-8 h-8" />;
      case 'Word': return <FileText className="text-blue-500 w-8 h-8" />;
      default: return <File className="text-gray-500 w-8 h-8" />;
    }
  };

  return (
    <div className="flex h-full relative">
      <PageContainer className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            My Files <span className="text-sm text-gray-400 mt-1 cursor-pointer">▼</span>
          </h1>
        </div>

        {/* Folders Section */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map(folder => (
              <div 
                key={folder.id} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  folder.active ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-xl ${folder.active ? 'bg-purple-100' : 'bg-gray-50'}`}>
                    <Folder className={`w-6 h-6 ${folder.active ? 'text-purple-600' : 'text-gray-400'}`} />
                  </div>
                  <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{folder.name}</h3>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{folder.count} files</span>
                  <span>{folder.storage}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Files Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Files</h2>
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-purple-50 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-purple-50 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="px-6 py-4 w-12"><CheckSquare className="w-4 h-4 text-gray-300" /></th>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Tags</th>
                    <th className="px-6 py-4 font-medium">Owner</th>
                    <th className="px-6 py-4 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {files.map(file => (
                    <tr 
                      key={file.id} 
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedFile(file)}
                    >
                      <td className="px-6 py-4"><CheckSquare className="w-4 h-4 text-gray-200" /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <span className="font-medium text-gray-700">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{file.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {file.tags.map(tag => (
                            <Badge key={tag} variant={tag === 'Work' ? 'blue' : tag === 'Important' ? 'orange' : 'purple'}>{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{file.owner}</td>
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map(file => (
                <div 
                  key={file.id} 
                  className="bg-white p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm cursor-pointer transition-all"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="h-32 bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-800 truncate pr-2">{file.name}</h3>
                    <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-gray-500">{file.date}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageContainer>

      {/* File Details Panel (Right Drawer) */}
      {selectedFile && (
        <div className="w-80 bg-white border-l border-gray-100 flex-shrink-0 flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-xl lg:relative lg:shadow-none transition-transform">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">File Details</h2>
            <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1.5 rounded-md">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                {getFileIcon(selectedFile.type)}
              </div>
              <h3 className="font-medium text-center text-gray-800 px-2">{selectedFile.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{selectedFile.size} • {selectedFile.type}</p>
            </div>

            <div className="flex gap-2 mb-6">
              <Button variant="primary" className="flex-1 text-sm py-2">Open</Button>
              <Button variant="outline" className="flex-1 text-sm py-2"><Share2 className="w-4 h-4" /> Share</Button>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1"><Info className="w-3 h-3"/> Property</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Size</span><span className="font-medium text-gray-800">{selectedFile.size}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-gray-800">{selectedFile.type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Owner</span><span className="font-medium text-gray-800">{selectedFile.owner}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="font-medium text-gray-800">{selectedFile.createdAt}</span></div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1"><Settings className="w-3 h-3"/> System Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Chunks</span><span className="font-medium text-gray-800">{selectedFile.chunks}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Replicas</span><span className="font-medium text-gray-800">{selectedFile.replicas}</span></div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Storage Placement</h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Primary</span><span className="font-medium text-purple-700">{selectedFile.primaryNode}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Replica</span><span className="font-medium text-gray-700">{selectedFile.replicaNode}</span></div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Access</h4>
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs text-purple-700 font-medium">AM</div>
                    <span className="text-gray-800">{selectedFile.owner} (Owner)</span>
                  </div>
                  {selectedFile.sharedWith.map((person, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-medium">{person.charAt(0)}</div>
                      <span className="text-gray-600">{person}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
