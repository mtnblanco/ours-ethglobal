'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Globe, MapPin, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function KYCPage() {
    const router = useRouter();
    const { user, isAuthenticated, completeKYC } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        country: '',
        address: '',
        city: '',
        postalCode: '',
        phoneNumber: '',
    });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else if (user?.kycCompleted) {
            router.push('/marketplace');
        }
    }, [isAuthenticated, user, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        completeKYC(formData);
        router.push('/marketplace');
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.fullName && formData.email && formData.phoneNumber;
            case 2:
                return formData.country && formData.city && formData.address;
            case 3:
                return true;
            default:
                return false;
        }
    };

    const steps = [
        { number: 1, title: 'Personal Info', icon: User },
        { number: 2, title: 'Address', icon: MapPin },
        { number: 3, title: 'Review', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-[#FFFBF5] overflow-x-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, #1E2046 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            <main className="relative pt-20 pb-16 px-4 md:px-6">
                <div className="container mx-auto max-w-4xl">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <img
                            src="/logo con todo.svg"
                            alt="Ours Logo"
                            className="w-48 mx-auto mb-8"
                        />
                        <h1 className="text-4xl font-bold text-[#1E2046] mb-3">
                            Complete Your Profile
                        </h1>
                        <p className="text-lg text-[#1E2046]/70">
                            We need a few details to comply with regulations and secure your account
                        </p>
                    </motion.div>

                    {/* Progress Steps */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between max-w-2xl mx-auto">
                            {steps.map((step, index) => (
                                <React.Fragment key={step.number}>
                                    <div className="flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            currentStep >= step.number
                                                ? 'bg-[#2D2E63] text-[#B0CBFF]'
                                                : 'bg-[#B0CBFF]/20 text-[#1E2046]/40'
                                        }`}>
                                            {currentStep > step.number ? (
                                                <CheckCircle2 className="w-8 h-8" />
                                            ) : (
                                                <step.icon className="w-8 h-8" />
                                            )}
                                        </div>
                                        <span className={`mt-2 text-sm font-semibold ${
                                            currentStep >= step.number
                                                ? 'text-[#1E2046]'
                                                : 'text-[#1E2046]/40'
                                        }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-4 rounded transition-all duration-300 ${
                                            currentStep > step.number
                                                ? 'bg-[#2D2E63]'
                                                : 'bg-[#B0CBFF]/20'
                                        }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-3xl border-2 border-black p-8 shadow-2xl"
                    >
                        {/* Step 1: Personal Information */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1E2046] mb-2">
                                        Personal Information
                                    </h2>
                                    <p className="text-[#1E2046]/60">
                                        Please provide your personal details
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#1E2046] mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-black/20 rounded-xl focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#1E2046] mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-black/20 rounded-xl focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#1E2046] mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-black/20 rounded-xl focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Address */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1E2046] mb-2">
                                        Address Information
                                    </h2>
                                    <p className="text-[#1E2046]/60">
                                        Where do you currently reside?
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[#1E2046] mb-2">
                                            Country *
                                        </label>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-black/20 rounded-xl focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                                        >
                                            <option value="">Select Country</option>
                                            <option value="US">United States</option>
                                            <option value="AR">Argentina</option>
                                            <option value="MX">Mexico</option>
                                            <option value="BR">Brazil</option>
                                            <option value="ES">Spain</option>
                                            <option value="FR">France</option>
                                            <option value="GB">United Kingdom</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-[#1E2046] mb-2">
                                            Street Address *
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-black/20 rounded-xl focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                                            placeholder="123 Main Street"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-[#1E2046] mb-2">
                                                City *
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-black/20 rounded-xl focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                                                placeholder="New York"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-[#1E2046] mb-2">
                                                Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-black/20 rounded-xl focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                                                placeholder="10001"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#1E2046] mb-2">
                                        Review Your Information
                                    </h2>
                                    <p className="text-[#1E2046]/60">
                                        Please verify all details are correct
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-[#FFFBF5] rounded-2xl p-6 border border-black/10">
                                        <h3 className="font-bold text-[#1E2046] mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            Personal Information
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-[#1E2046]/60">Full Name:</span>
                                                <span className="font-semibold text-[#1E2046]">{formData.fullName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#1E2046]/60">Email:</span>
                                                <span className="font-semibold text-[#1E2046]">{formData.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#1E2046]/60">Phone:</span>
                                                <span className="font-semibold text-[#1E2046]">{formData.phoneNumber}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#FFFBF5] rounded-2xl p-6 border border-black/10">
                                        <h3 className="font-bold text-[#1E2046] mb-4 flex items-center gap-2">
                                            <MapPin className="w-5 h-5" />
                                            Address
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-[#1E2046]/60">Country:</span>
                                                <span className="font-semibold text-[#1E2046]">{formData.country}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#1E2046]/60">Address:</span>
                                                <span className="font-semibold text-[#1E2046]">{formData.address}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#1E2046]/60">City:</span>
                                                <span className="font-semibold text-[#1E2046]">{formData.city}</span>
                                            </div>
                                            {formData.postalCode && (
                                                <div className="flex justify-between">
                                                    <span className="text-[#1E2046]/60">Postal Code:</span>
                                                    <span className="font-semibold text-[#1E2046]">{formData.postalCode}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-[#B0CBFF]/10 rounded-2xl border border-[#B0CBFF]/30 p-6">
                                        <p className="text-sm text-[#1E2046]/70">
                                            By submitting this information, you confirm that all details are accurate and agree to our Terms of Service and Privacy Policy. Your data is encrypted and stored securely.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 mt-8 pt-6 border-t border-black/10">
                            {currentStep > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="flex-1 px-6 py-3 border-2 border-black/20 text-[#1E2046] rounded-xl font-semibold hover:bg-black/5 transition-colors"
                                >
                                    Back
                                </button>
                            )}

                            <button
                                onClick={currentStep === 3 ? handleSubmit : handleNext}
                                disabled={!isStepValid()}
                                className="flex-1 px-6 py-3 bg-[#2D2E63] text-[#B0CBFF] rounded-xl font-semibold hover:bg-[#1E2046] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {currentStep === 3 ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Complete KYC
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
