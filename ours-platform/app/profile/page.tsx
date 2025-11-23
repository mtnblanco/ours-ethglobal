'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Globe, Calendar, CheckCircle, Shield, Edit2, Save, X, Wallet, Store, LogOut } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import TabNavigation from '@/components/TabNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    country: user?.country || '',
  });

  const handleSave = () => {
    // Aquí se implementaría la lógica para guardar los cambios
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      country: user?.country || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFBF5] pb-24 md:pb-16 overflow-x-hidden">
        <Navbar />
        <TabNavigation />

        <main className="pt-32 pb-16 px-4 md:px-6">
          <div className="container mx-auto max-w-4xl">

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-[#1E2046] mb-2">My Profile</h1>
              <p className="text-lg text-[#1E2046]/60">Manage your account information</p>
            </motion.div>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border-2 border-black p-8 shadow-lg mb-6"
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#2D2E63] to-[#B0CBFF] rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1E2046]">{user?.fullName || 'User'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-semibold">KYC Verified</span>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-300"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Information */}
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1E2046]/70 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                    />
                  ) : (
                    <p className="text-lg text-[#1E2046] px-4 py-3 bg-[#FFFBF5] rounded-lg">{user?.fullName || 'Not provided'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1E2046]/70 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                    />
                  ) : (
                    <p className="text-lg text-[#1E2046] px-4 py-3 bg-[#FFFBF5] rounded-lg">{user?.email || 'Not provided'}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1E2046]/70 mb-2">
                    <MapPin className="w-4 h-4" />
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                    />
                  ) : (
                    <p className="text-lg text-[#1E2046] px-4 py-3 bg-[#FFFBF5] rounded-lg">{user?.country || 'Not provided'}</p>
                  )}
                </div>

                {/* World ID */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1E2046]/70 mb-2">
                    <Globe className="w-4 h-4" />
                    World ID
                  </label>
                  <p className="text-sm text-[#1E2046] px-4 py-3 bg-[#FFFBF5] rounded-lg font-mono break-all">{user?.worldId}</p>
                </div>

                {/* Account Status */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#1E2046]/70 mb-2">
                    <Shield className="w-4 h-4" />
                    Account Status
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">Verified Account</p>
                      <p className="text-xs text-green-700">KYC completed and World ID verified</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout Section */}
              <div className="mt-8 pt-8 border-t border-black/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
                <p className="text-xs text-center text-[#1E2046]/50 mt-3">
                  You will be redirected to the login page
                </p>
              </div>
            </motion.div>

            {/* Account Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="bg-white rounded-2xl border-2 border-black p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-6 h-6 text-[#2D2E63]" />
                  <h3 className="font-bold text-[#1E2046]">Total Invested</h3>
                </div>
                <p className="text-3xl font-bold text-[#2D2E63]">$0.00</p>
                <p className="text-sm text-[#1E2046]/60 mt-1">Across all properties</p>
              </div>

              <div className="bg-white rounded-2xl border-2 border-black p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-[#2D2E63]" />
                  <h3 className="font-bold text-[#1E2046]">Member Since</h3>
                </div>
                <p className="text-xl font-bold text-[#2D2E63]">
                  {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm text-[#1E2046]/60 mt-1">Active investor</p>
              </div>

              <div className="bg-white rounded-2xl border-2 border-black p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Store className="w-6 h-6 text-[#2D2E63]" />
                  <h3 className="font-bold text-[#1E2046]">Properties</h3>
                </div>
                <p className="text-3xl font-bold text-[#2D2E63]">0</p>
                <p className="text-sm text-[#1E2046]/60 mt-1">In portfolio</p>
              </div>
            </motion.div>

          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
