'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

const Logo = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex items-center gap-1">
    <Link href="/">
      <img
        src="/logo con todo.svg"
        alt="Ours Logo"
        className="w-auto h-10 cursor-pointer"
      />
    </Link>
  </div>
);

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-[150] bg-[#FDFBF7]/95 backdrop-blur-md py-4 md:py-6 border-b border-[#1E2046]/5">
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo - más grande y responsive */}
        <div className="flex items-center flex-shrink-0">
          <div className="w-32 sm:w-40 md:w-48 lg:w-56">
            <Logo />
          </div>
        </div>

        {/* Navigation Links - ocultos en mobile y tablet pequeño */}
        <div className="hidden lg:flex items-center gap-8 xl:gap-12 font-semibold text-sm xl:text-base">
          <Link href="/" className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors relative group whitespace-nowrap">
            Home
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-[#B0C9FF] group-hover:w-full transition-all duration-300"></span>
          </Link>

          <Link href="/marketplace" className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors relative group whitespace-nowrap">
            Marketplace
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-[#B0C9FF] group-hover:w-full transition-all duration-300"></span>
          </Link>

          <a href="/#core" className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors relative group whitespace-nowrap">
            Core Features
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-[#B0C9FF] group-hover:w-full transition-all duration-300"></span>
          </a>

          <a href="/#standards" className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors relative group whitespace-nowrap">
            Standards
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-[#B0C9FF] group-hover:w-full transition-all duration-300"></span>
          </a>

          {/* Auth Section - Desktop */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[#1E2046]/70">
                <User className="w-4 h-4" />
                <span className="text-sm">{user?.fullName || user?.worldId?.slice(0, 10) + '...'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300 whitespace-nowrap"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button - visible en mobile y tablet */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex flex-col gap-1.5 w-6 h-5 justify-center flex-shrink-0"
          aria-label="Menu"
        >
          <span className={`w-full h-0.5 bg-[#1E2046] rounded-full transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-full h-0.5 bg-[#1E2046] rounded-full transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-full h-0.5 bg-[#1E2046] rounded-full transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="lg:hidden bg-[#FDFBF7] border-t border-[#1E2046]/5 py-4"
        >
          <div className="container mx-auto px-4 sm:px-6 flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors font-semibold py-2"
            >
              Home
            </Link>

            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors font-semibold py-2"
            >
              Marketplace
            </Link>

            <a
              href="/#core"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors font-semibold py-2"
            >
              Core Features
            </a>

            <a
              href="/#standards"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors font-semibold py-2"
            >
              Standards
            </a>

            {/* Auth Section - Mobile */}
            <div className="border-t border-[#1E2046]/10 pt-4 mt-2">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#1E2046]/70 py-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-semibold">{user?.fullName || user?.worldId?.slice(0, 15) + '...'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-6 py-2 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
