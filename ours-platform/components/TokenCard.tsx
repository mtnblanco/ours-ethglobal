'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';

export const TokenCard = () => {
  return (
    <div className="bg-[#1E2046] text-white p-6 rounded-2xl shadow-2xl w-64 mx-auto font-mono text-xs relative border border-white/10">
      <div className="absolute top-4 right-4 opacity-50">
        <Smartphone size={20} />
      </div>
      <div className="mt-8 mb-4 text-gray-400">ASSET TOKEN</div>
      <div className="text-lg font-bold text-[#B0C9FF] mb-4">PROPERTY PT01</div>

      <div className="flex justify-between mb-2">
        <span className="text-gray-400">SUPPLY</span>
        <span>5,000 PT01</span>
      </div>
      <div className="flex justify-between mb-6">
        <span className="text-gray-400">UNIT PRICE</span>
        <span>20 USDC</span>
      </div>

      <div className="flex items-center gap-2 text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        KYC Verified
      </div>
    </div>
  );
};

export default TokenCard;