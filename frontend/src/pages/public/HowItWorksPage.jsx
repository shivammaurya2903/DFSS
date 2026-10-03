import React from 'react';
import { Upload, Download, ArrowRight } from 'lucide-react';

const HowItWorksPage = () => {
  const uploadSteps = [
    "You select a file",
    "File is validated (type check, size check)",
    "Content is compressed if beneficial",
    "File is encrypted with AES before leaving the processing layer",
    "SHA-256 hash computed for integrity baseline",
    "File is chunked into fixed-size pieces",
    "Placement engine selects optimal node pairs for primary + replicas",
    "Chunks distributed to storage nodes",
    "Replica confirmation received",
    "File metadata stored in MongoDB"
  ];

  const downloadSteps = [
    "You request a file",
    "Your identity is verified (JWT)",
    "Chunk locations retrieved from metadata",
    "Chunks fetched from storage nodes (fallback to replicas if needed)",
    "Chunk integrity verified using SHA-256",
    "Chunks reassembled in order",
    "Content decrypted",
    "Decompressed if originally compressed",
    "Original file delivered to you"
  ];

  return (
    <div className="flex flex-col w-full bg-[#F5F7FB] py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#17181C] mb-6">How It Works</h1>
          <p className="text-xl text-[#6F737D] max-w-3xl mx-auto">
            The lifecycle of your data, from selection to secure retrieval.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Upload Flow */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#8178F2] rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#17181C]">Upload Flow</h2>
            </div>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E7E9EF] before:to-transparent">
              {uploadSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#8178F2] text-white font-bold text-sm shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {idx + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-[#E7E9EF] shadow-sm">
                    <p className="text-[#17181C] font-medium">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download Flow */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#69B38A] rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#17181C]">Download Flow</h2>
            </div>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E7E9EF] before:to-transparent">
              {downloadSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#69B38A] text-white font-bold text-sm shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {idx + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-[#E7E9EF] shadow-sm">
                    <p className="text-[#17181C] font-medium">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
