import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircleQuestion } from 'lucide-react';

const FAQPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  const faqCategories = [
    {
      category: "General",
      questions: [
        {
          q: "What is DFSS?",
          a: "A distributed file storage system that encrypts, chunks, and replicates your files across multiple storage nodes."
        },
        {
          q: "Who is this for?",
          a: "Anyone who needs secure, reliable, and private storage for their files, away from traditional centralized providers."
        },
        {
          q: "What file types are supported?",
          a: "All file types are supported. The browser preview supports common formats like PDF, images, text, video, and audio."
        }
      ]
    },
    {
      category: "Storage & Quota",
      questions: [
        {
          q: "How much storage do I get?",
          a: "New accounts receive a 100 MB complimentary storage quota to test the system."
        },
        {
          q: "How is my storage quota calculated?",
          a: "Usage is based on the optimized/compressed size stored on the network, not the original file size."
        },
        {
          q: "What happens if I delete a file?",
          a: "The metadata is removed immediately and the chunks are marked for garbage collection. Your quota is freed up."
        }
      ]
    },
    {
      category: "Security",
      questions: [
        {
          q: "How are my files protected?",
          a: "Files are encrypted with AES before being chunked. Each chunk has a SHA-256 checksum for integrity verification."
        },
        {
          q: "Can DFSS administrators read my files?",
          a: "No. Files are encrypted and chunked. No single node has a complete file, and decryption requires the application tier context."
        },
        {
          q: "Is my password stored securely?",
          a: "Yes, passwords are never stored in plain text. We use robust bcrypt hashing algorithms."
        }
      ]
    },
    {
      category: "Sharing",
      questions: [
        {
          q: "Can I share files with people who don't have an account?",
          a: "Yes, you can generate public share links that do not require the recipient to log in."
        },
        {
          q: "Can I revoke a share link?",
          a: "Yes, share links can be revoked instantly from your dashboard."
        },
        {
          q: "Do share links expire?",
          a: "Yes, all share links are time-limited cryptographically for security."
        }
      ]
    },
    {
      category: "Technical Architecture",
      questions: [
        {
          q: "What happens if a storage node fails?",
          a: "Files are replicated across multiple nodes. The system detects failures via heartbeats and automatically recovers chunks from replicas."
        },
        {
          q: "What is 'Intelligent Placement'?",
          a: "Our algorithm decides which nodes receive which chunks based on real-time node health, available capacity, and system load."
        },
        {
          q: "Why is chunking used?",
          a: "Chunking allows files to be distributed across many nodes, preventing single points of failure and improving parallel transfer speeds."
        }
      ]
    }
  ];

  let qIndex = 0;

  return (
    <div className="flex flex-col w-full bg-[#F5F7FB] py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-16">
          <MessageCircleQuestion className="w-16 h-16 text-[#8178F2] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#17181C] mb-6">Frequently Asked Questions</h1>
          <p className="text-xl text-[#6F737D]">
            Everything you need to know about the product and billing.
          </p>
        </div>

        <div className="space-y-12">
          {faqCategories.map((group, gIdx) => (
            <div key={gIdx}>
              <h2 className="text-2xl font-bold text-[#17181C] mb-6 pl-2 border-l-4 border-[#8178F2]">
                {group.category}
              </h2>
              <div className="space-y-4">
                {group.questions.map((faq) => {
                  const currentIndex = qIndex++;
                  return (
                    <div key={currentIndex} className="bg-white border border-[#E7E9EF] rounded-lg overflow-hidden shadow-sm">
                      <button
                        className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-[#F5F7FB] transition-colors"
                        onClick={() => toggleFaq(currentIndex)}
                      >
                        <span className="font-semibold text-left text-[#17181C] pr-8">{faq.q}</span>
                        {openFaq === currentIndex ? (
                          <ChevronUp className="w-5 h-5 text-[#8178F2] shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#6F737D] shrink-0" />
                        )}
                      </button>
                      {openFaq === currentIndex && (
                        <div className="px-6 py-4 bg-[#F8F9FC] border-t border-[#E7E9EF]">
                          <p className="text-[#6F737D]">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
