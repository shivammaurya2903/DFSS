export const folders = [
  { id: 1, name: 'Documents', count: 120, storage: '1.2 GB', updated: '2 hrs ago', icon: 'Folder', color: 'blue' },
  { id: 2, name: 'Images', count: 450, storage: '4.5 GB', updated: '5 hrs ago', icon: 'Image', color: 'purple', active: true },
  { id: 3, name: 'Videos', count: 32, storage: '12 GB', updated: '1 day ago', icon: 'Video', color: 'orange' },
  { id: 4, name: 'Projects', count: 85, storage: '800 MB', updated: '3 days ago', icon: 'Briefcase', color: 'green' }
];

export const files = [
  { id: 1, name: 'Project_Proposal_v2.pdf', type: 'PDF', date: 'Oct 24, 2023', tags: ['Work', 'Important'], owner: 'Alex M.', size: '2.4 MB', chunks: 3, replicas: 2, createdAt: 'Oct 20, 2023', primaryNode: 'Node-Alpha', replicaNode: 'Node-Beta', sharedWith: ['John D.', 'Sarah C.'], access: 'Read/Write' },
  { id: 2, name: 'Q3_Financial_Report.xlsx', type: 'Excel', date: 'Oct 23, 2023', tags: ['Finance'], owner: 'Jane D.', size: '4.1 MB', chunks: 5, replicas: 2, createdAt: 'Oct 15, 2023', primaryNode: 'Node-Gamma', replicaNode: 'Node-Alpha', sharedWith: ['Team A'], access: 'Read' },
  { id: 3, name: 'Dashboard_Design.fig', type: 'Figma', date: 'Oct 22, 2023', tags: ['Design'], owner: 'Alex M.', size: '12.5 MB', chunks: 12, replicas: 3, createdAt: 'Oct 10, 2023', primaryNode: 'Node-Beta', replicaNode: 'Node-Gamma, Node-Delta', sharedWith: ['Marketing'], access: 'Read/Write' },
  { id: 4, name: 'Meeting_Notes.docx', type: 'Word', date: 'Oct 21, 2023', tags: ['Work'], owner: 'Alex M.', size: '1.1 MB', chunks: 2, replicas: 2, createdAt: 'Oct 21, 2023', primaryNode: 'Node-Alpha', replicaNode: 'Node-Delta', sharedWith: [], access: 'Private' }
];

export const nodes = [
  { id: 1, name: 'Node-Alpha', status: 'Healthy', capacity: '1 TB', used: '600 GB', load: '45%', latency: '12ms' },
  { id: 2, name: 'Node-Beta', status: 'Healthy', capacity: '1 TB', used: '800 GB', load: '75%', latency: '18ms' },
  { id: 3, name: 'Node-Gamma', status: 'Healthy', capacity: '2 TB', used: '400 GB', load: '20%', latency: '8ms' },
  { id: 4, name: 'Node-Delta', status: 'Warning', capacity: '500 GB', used: '450 GB', load: '90%', latency: '35ms' }
];
