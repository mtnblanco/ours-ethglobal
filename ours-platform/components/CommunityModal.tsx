'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Twitter, Send } from 'lucide-react';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommunityModal({ isOpen, onClose }: CommunityModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[200] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[90%] max-w-md bg-white rounded-3xl shadow-2xl p-8 border-2 border-black"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#1E2046] mb-2">Join Our Community</h2>
              <p className="text-[#1E2046]/60">Connect with other investors and stay updated</p>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              {/* Twitter/X */}
              <a
                href="https://twitter.com/ours_platform"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-black to-gray-800 rounded-xl hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <Twitter className="w-7 h-7 text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">X (Twitter)</h3>
                  <p className="text-gray-300 text-sm">Follow for news and updates</p>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xl">→</span>
                </div>
              </a>

              {/* Telegram */}
              <a
                href="https://t.me/ours_platform"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#0088cc] to-[#006699] rounded-xl hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <Send className="w-7 h-7 text-[#0088cc]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg">Telegram</h3>
                  <p className="text-blue-100 text-sm">Join our community chat</p>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xl">→</span>
                </div>
              </a>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-[#B0CBFF]/10 rounded-xl border border-[#B0CBFF]/30">
              <p className="text-sm text-[#1E2046]/70 text-center">
                Get real-time updates, discuss strategies with fellow investors, and be the first to know about new property listings
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
