import React from 'react';
import { Network, Lock, ShieldCheck, Cpu, Copy, Wrench, Shrink, Share, Eye, BarChart3, List, Activity } from 'lucide-react';

const FeaturesPage = () => {
  const features = [
    {
      icon: Network,
      title: "Distributed Chunk Storage",
      desc: "Files are split into fixed-size chunks distributed across independent storage nodes. No single node holds a complete file."
    },
    {
      icon: Lock,
      title: "AES-256 Encryption",
      desc: "Every file is encrypted before storage. Decryption happens server-side during authorized retrieval."
    },
    {
      icon: ShieldCheck,
      title: "SHA-256 Integrity Verification",
      desc: "Each chunk is checksummed. The system verifies integrity on every retrieval. Corrupted chunks are detected automatically."
    },
    {
      icon: Cpu,
      title: "Intelligent Placement",
      desc: "The placement engine considers node health, capacity, latency, and load when deciding where to store chunks. Strategy is adaptive."
    },
    {
      icon: Copy,
      title: "Automatic Replication",
      desc: "Chunks are replicated across multiple nodes using configurable replication policies. Primary and replica placement are jointly optimized."
    },
    {
      icon: Wrench,
      title: "Failure Recovery",
      desc: "The heartbeat monitor detects node failures. The recovery manager restores chunk replicas from surviving copies automatically."
    },
    {
      icon: Shrink,
      title: "Storage Optimization",
      desc: "Files are compressed when beneficial before encryption. Compression savings reduce quota usage."
    },
    {
      icon: Share,
      title: "Secure File Sharing",
      desc: "Time-limited cryptographic share tokens allow controlled public access to individual files without exposing your account."
    },
    {
      icon: Eye,
      title: "File Preview",
      desc: "PDF, images, text, code, video, and audio files can be previewed in the browser without downloading."
    },
    {
      icon: BarChart3,
      title: "Storage Analytics",
      desc: "Track your quota usage, compression savings, and file statistics from your storage dashboard."
    },
    {
      icon: List,
      title: "Activity Log",
      desc: "Every upload, download, view, share, and delete event is recorded in a per-user audit trail."
    },
    {
      icon: Activity,
      title: "Node Health Monitoring",
      desc: "Admin view of all storage nodes: status, capacity, load, latency, and heartbeat status."
    }
  ];

  return (
    <div className="flex flex-col w-full bg-[#F5F7FB] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#17181C] mb-6">Feature Overview</h1>
          <p className="text-xl text-[#6F737D] max-w-3xl mx-auto">
            Deep dive into the architecture and capabilities that power our secure distributed storage engine.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-[#E7E9EF] shadow-sm hover:border-[#8178F2] transition-colors">
              <div className="w-12 h-12 bg-[#F5F7FB] rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[#8178F2]" />
              </div>
              <h3 className="text-lg font-bold text-[#17181C] mb-2">{feature.title}</h3>
              <p className="text-[#6F737D] text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
