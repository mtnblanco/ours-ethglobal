'use client';

import React from 'react';

const Logo = () => (
  <div className="flex items-center gap-1">
    <img
      src="/logo con todo.svg"
      alt="Ours Logo"
      className="w-auto h-10"
    />
  </div>
);

export default function Footer() {
  return (
    <footer className="bg-[#FDFBF7] pt-2 pb-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">

          {/* Left: Brand + Desc */}
          <div className="max-w-sm">
            <div className="mb-6">
              <Logo />
            </div>
            <p className="text-sm font-medium leading-relaxed text-[#1E2046]">
              Bridging real estate and blockchain in a secure, institutional-grade environment.
            </p>
          </div>

          {/* Right: Socials */}
          <div className="flex gap-6">
            {[
              { icon: "/resources/icons/linkedin.svg", label: "ours", alt: "LinkedIn" },
              { icon: "/resources/icons/instagram.svg", label: "ours", alt: "Instagram" },
              { icon: "/resources/icons/x.svg", label: "ours", alt: "X (Twitter)" }
            ].map((social, idx) => (
              <a
                key={idx}
                href="#"
                className="flex items-center gap-2 text-[#1E2046] hover:text-[#4A569D] transition-colors"
              >
                <div className="bg-[#1E2046] text-white p-1.5 rounded-md flex items-center justify-center w-8 h-8">
                  <img src={social.icon} alt={social.alt} className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">{social.label}</span>
              </a>
            ))}
          </div>

        </div>

        {/* Copyright / Bottom Line */}
        <div className="mt-12 pt-8 border-t border-[#1E2046]/10 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Ours Tokenization. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
