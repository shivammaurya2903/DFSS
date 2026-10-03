import React from 'react';
import { Shield, Key, FileCheck, SplitSquareHorizontal, Share2, Users, Network } from 'lucide-react';

const SecurityPage = () => {
  return (
    <div className="flex flex-col w-full bg-[#F5F7FB] py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-16">
          <Shield className="w-16 h-16 text-[#8178F2] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#17181C] mb-6">Security & Privacy</h1>
          <p className="text-xl text-[#6F737D]">
            An in-depth look at how DFSS protects data at rest, in transit, and during access.
          </p>
        </div>

        <div className="space-y-12">
          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm flex gap-6">
            <Key className="w-8 h-8 text-[#8178F2] shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-[#17181C] mb-3">1. Authentication</h2>
              <p className="text-[#6F737D]">
                All sessions are managed using securely signed JWT (JSON Web Tokens) with strict expiration policies. Passwords are never stored in plaintext; we utilize bcrypt with adaptive work factors for all password hashing.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm flex gap-6">
            <Lock className="w-8 h-8 text-[#8178F2] shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-[#17181C] mb-3">2. Encryption</h2>
              <p className="text-[#6F737D]">
                Industry-standard AES encryption is applied to every file before it undergoes chunking. Keys are derived securely from server configurations, ensuring that data stored on individual nodes is unreadable without the central application tier.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm flex gap-6">
            <FileCheck className="w-8 h-8 text-[#8178F2] shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-[#17181C] mb-3">3. Integrity</h2>
              <p className="text-[#6F737D]">
                Data degradation (bit rot) is a reality. We compute SHA-256 checksums on every individual chunk. During retrieval, each chunk is verified against its known hash. If a mismatch occurs, the system automatically fetches a healthy replica.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm flex gap-6">
            <SplitSquareHorizontal className="w-8 h-8 text-[#8178F2] shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-[#17181C] mb-3">4. Chunk-level Protection</h2>
              <p className="text-[#6F737D]">
                By design, no single storage node holds a complete file. Files are fragmented into fixed-size chunks and distributed. Even if a node is fully compromised, an attacker would only retrieve encrypted fragments of unrelated files.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm flex gap-6">
            <Share2 className="w-8 h-8 text-[#8178F2] shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-[#17181C] mb-3">5. Secure Sharing</h2>
              <p className="text-[#6F737D]">
                Shared links rely on cryptographic tokens. These tokens are time-limited, bound to specific files, and can be revoked by the owner at any time. They do not expose user credentials or grant broader access.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm flex gap-6">
            <Users className="w-8 h-8 text-[#8178F2] shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-[#17181C] mb-3">6. Access Control</h2>
              <p className="text-[#6F737D]">
                File operations are strictly owner-scoped. Every API request is verified against the authenticated user's ID. We also maintain a strict role separation between standard users and system administrators.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#E7E9EF] shadow-sm flex gap-6">
            <Network className="w-8 h-8 text-[#8178F2] shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-[#17181C] mb-3">7. Transport Security</h2>
              <p className="text-[#6F737D]">
                All communications between the client, API, and storage nodes are designed to be run over HTTPS in production environments, ensuring data is encrypted in transit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Lock import that was missed above
import { Lock } from 'lucide-react';

export default SecurityPage;
