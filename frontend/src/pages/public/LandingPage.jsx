import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Lock, Shield, Layers, FileDown, EyeOff, Zap, Share2, Server, Database, ServerCrash, FileLock2 } from 'lucide-react';

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  const faqs = [
    {
      q: "What is DFSS?",
      a: "A distributed file storage system that encrypts, chunks, and replicates your files across multiple storage nodes."
    },
    {
      q: "How is my storage quota calculated?",
      a: "Usage is based on the optimized/compressed size stored, not the original file size."
    },
    {
      q: "What happens if a storage node fails?",
      a: "Files are replicated across multiple nodes. The system detects failures and automatically recovers from replicas."
    },
    {
      q: "How are my files protected?",
      a: "Files are encrypted with AES before being chunked and stored. Each chunk has a SHA-256 checksum for integrity verification."
    },
    {
      q: "Can I share files without requiring the recipient to log in?",
      a: "Yes. Shared links work publicly without requiring any account."
    },
    {
      q: "What file types are supported?",
      a: "All file types are supported for storage. PDF, images, text, video, and audio can be previewed in the browser."
    }
  ];

  return (
    <div className="flex flex-col w-full bg-[#F5F7FB]">
      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#17181C] tracking-tight mb-6 max-w-4xl mx-auto">
          Distributed Storage Built for <span className="text-[#8178F2]">Secure</span> File Management.
        </h1>
        <p className="text-lg md:text-xl text-[#6F737D] mb-10 max-w-3xl mx-auto">
          Store, organize, access, and share files through a secure distributed storage platform designed for reliability, integrity, and intelligent placement.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Link to="/register" className="px-8 py-3 bg-[#8178F2] hover:bg-[#6c63e6] text-white font-medium rounded-lg shadow-sm transition-all">
            Start Free
          </Link>
          <Link to="/features" className="px-8 py-3 bg-white border border-[#E7E9EF] hover:border-[#8178F2] text-[#17181C] font-medium rounded-lg shadow-sm transition-all">
            Explore Features
          </Link>
        </div>

        {/* Visual Flow Diagram */}
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-3">
                <FileLock2 className="w-8 h-8 text-[#8178F2]" />
              </div>
              <span className="text-sm font-semibold text-[#17181C]">User File</span>
              <span className="text-xs text-[#6F737D]">Original</span>
            </div>
            
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#8178F2] to-transparent md:block hidden"></div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-3">
                <Lock className="w-8 h-8 text-[#8178F2]" />
              </div>
              <span className="text-sm font-semibold text-[#17181C]">Encrypted</span>
              <span className="text-xs text-[#6F737D]">AES-256</span>
            </div>

            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#8178F2] to-transparent md:block hidden"></div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-3">
                <Layers className="w-8 h-8 text-[#8178F2]" />
              </div>
              <span className="text-sm font-semibold text-[#17181C]">Chunked</span>
              <span className="text-xs text-[#6F737D]">SHA-256</span>
            </div>

            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#8178F2] to-transparent md:block hidden"></div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F5F7FB] rounded-full flex items-center justify-center mb-3">
                <Server className="w-8 h-8 text-[#8178F2]" />
              </div>
              <span className="text-sm font-semibold text-[#17181C]">Replicated</span>
              <span className="text-xs text-[#6F737D]">Distributed Nodes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-white border-y border-[#E7E9EF] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-[#E7E9EF]">
            <div className="flex flex-col items-center text-center px-4">
              <Shield className="w-6 h-6 text-[#8178F2] mb-3" />
              <h3 className="font-semibold text-[#17181C]">SHA-256 Integrity</h3>
              <p className="text-xs text-[#6F737D] mt-1">Constant verification</p>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <Database className="w-6 h-6 text-[#8178F2] mb-3" />
              <h3 className="font-semibold text-[#17181C]">Automatic Replication</h3>
              <p className="text-xs text-[#6F737D] mt-1">Multi-node backups</p>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <Zap className="w-6 h-6 text-[#8178F2] mb-3" />
              <h3 className="font-semibold text-[#17181C]">100 MB Storage</h3>
              <p className="text-xs text-[#6F737D] mt-1">Free introductory tier</p>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <EyeOff className="w-6 h-6 text-[#8178F2] mb-3" />
              <h3 className="font-semibold text-[#17181C]">Zero Knowledge Layout</h3>
              <p className="text-xs text-[#6F737D] mt-1">Decentralized storage</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#17181C]">Simple by design. Powerful underneath.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm">
            <div className="w-12 h-12 bg-[#F5F7FB] text-[#8178F2] rounded-lg flex items-center justify-center font-bold text-xl mb-6">1</div>
            <h3 className="text-xl font-semibold mb-4 text-[#17181C]">Upload & Prepare</h3>
            <p className="text-[#6F737D]">Upload → Compress → Encrypt → Chunk. Your file is processed securely in memory before it ever hits our storage layer.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm">
            <div className="w-12 h-12 bg-[#F5F7FB] text-[#8178F2] rounded-lg flex items-center justify-center font-bold text-xl mb-6">2</div>
            <h3 className="text-xl font-semibold mb-4 text-[#17181C]">Intelligent Distribution</h3>
            <p className="text-[#6F737D]">Intelligent Placement → Multi-node Distribution. Chunks are scattered across optimal storage nodes based on capacity and health.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm">
            <div className="w-12 h-12 bg-[#F5F7FB] text-[#8178F2] rounded-lg flex items-center justify-center font-bold text-xl mb-6">3</div>
            <h3 className="text-xl font-semibold mb-4 text-[#17181C]">Retrieve & Assemble</h3>
            <p className="text-[#6F737D]">Download → Reconstruct → Decrypt → Verify. Files are pieced back together on the fly while verifying cryptographic integrity.</p>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 bg-white border-y border-[#E7E9EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#17181C]">Your files. Protected at every layer.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <Lock className="w-10 h-10 text-[#8178F2] mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-[#17181C]">AES Encryption</h3>
              <p className="text-[#6F737D]">Files are encrypted before leaving your browser session context. Data at rest is fully secured.</p>
            </div>
            <div className="p-6">
              <Shield className="w-10 h-10 text-[#8178F2] mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-[#17181C]">SHA-256 Integrity</h3>
              <p className="text-[#6F737D]">Every chunk is checksummed. Corrupted data is detected and recovered automatically.</p>
            </div>
            <div className="p-6">
              <ServerCrash className="w-10 h-10 text-[#8178F2] mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-[#17181C]">Access Control</h3>
              <p className="text-[#6F737D]">JWT-authenticated API. File shares use time-limited cryptographic tokens.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Storage Optimization Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#17181C] mb-6">Your quota. Used wisely.</h2>
            <p className="text-lg text-[#6F737D] mb-6">
              Storage usage is calculated from the optimized size stored, not the original file size. Files that compress well consume less of your 100 MB quota.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm">
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-[#17181C]">Original File (10 MB)</span>
                </div>
                <div className="w-full bg-[#F5F7FB] rounded-full h-4">
                  <div className="bg-[#6F737D] h-4 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-[#8178F2]">Stored in DFSS (6.2 MB)</span>
                  <span className="text-sm font-semibold text-[#69B38A]">38% Savings</span>
                </div>
                <div className="w-full bg-[#F5F7FB] rounded-full h-4">
                  <div className="bg-[#8178F2] h-4 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* File Sharing Section */}
      <section className="py-24 bg-white border-y border-[#E7E9EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <Share2 className="w-16 h-16 text-[#8178F2] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[#17181C] mb-6">Share securely. Control access.</h2>
          <p className="text-lg text-[#6F737D] max-w-2xl mx-auto">
            Generate time-limited share links and revoke them anytime. Recipients can preview and download files instantly, with no login required.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#17181C]">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border border-[#E7E9EF] rounded-lg overflow-hidden">
              <button
                className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-[#F5F7FB] transition-colors"
                onClick={() => toggleFaq(index)}
              >
                <span className="font-semibold text-left text-[#17181C]">{faq.q}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-[#6F737D]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#6F737D]" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 py-4 bg-white border-t border-[#E7E9EF]">
                  <p className="text-[#6F737D]">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-[#17181C]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to store your files securely?</h2>
          <p className="text-lg text-[#9A9EA8] mb-10">
            Start with 100 MB of distributed encrypted storage. No payment required.
          </p>
          <Link to="/register" className="inline-block px-8 py-3 bg-[#8178F2] hover:bg-[#6c63e6] text-white font-medium rounded-lg shadow-sm transition-all">
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
