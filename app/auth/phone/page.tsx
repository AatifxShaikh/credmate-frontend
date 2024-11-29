"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import Image from 'next/image';

// Country codes data
const countryCodes = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
];

export default function PhoneAuthPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryList, setShowCountryList] = useState(false);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
  };

  const handlePhoneSubmit = async (phone: string) => {
    try {
      setLoading(true);
      setError("");
      
      setupRecaptcha();
      const formattedPhone = selectedCountry.code + phone;
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        (window as any).recaptchaVerifier
      );
      
      setConfirmationResult(confirmation);
      setPhoneNumber(phone);
      setShowOTP(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      console.error("Phone auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (otp: string) => {
    try {
      setLoading(true);
      setError("");
      
      if (!confirmationResult) {
        throw new Error("Please request OTP first");
      }

      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Get the token and log it
      const token = await user.getIdToken(true); // Force token refresh
      console.log('Firebase Auth Success');
      console.log('User ID:', user.uid);
      console.log('Phone:', user.phoneNumber);
      console.log('Firebase ID Token:', token);
      
      // Store token in localStorage and cookie
      localStorage.setItem('authToken', token);
      document.cookie = `authToken=${token}; path=/`;
      
      // Log the stored values
      console.log('Stored token in localStorage:', localStorage.getItem('authToken'));
      console.log('Current user after auth:', auth.currentUser?.uid);
      
      // Navigate to home page
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
      console.error("OTP verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = (country: typeof countryCodes[0]) => {
    setSelectedCountry(country);
    setShowCountryList(false);
  };

  const isValidPhoneNumber = phoneNumber.length === 10;

  const handleSendOTP = () => {
    handlePhoneSubmit(phoneNumber);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 pt-16 pb-24 bg-gradient-to-br from-white to-pink-50 min-h-full">
          <div className="max-w-md mx-auto pt-12">
            <div className="flex flex-col items-center mb-12">
              <Image
                src="/images/logo 1 (6).svg"
                alt="Credmate Logo"
                width={200}
                height={53}
                className="w-[200px] h-[53px] mb-4"
              />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-700 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                Your Credit Journey Starts Here
              </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-8 border border-pink-100">
              <h1 className="text-2xl font-bold text-neutral-800 mb-2 bg-gradient-to-r from-pink-700 to-pink-500 bg-clip-text text-transparent">
                {showOTP ? "Verify OTP" : "Welcome Back"}
              </h1>
              <p className="text-base text-neutral-600 mb-8">
                {showOTP 
                  ? `Please enter the verification code sent to ${selectedCountry.code} ${phoneNumber}` 
                  : "Enter your phone number to continue"}
              </p>

              <div className="space-y-6">
                {!showOTP ? (
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative flex gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          className="h-12 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center gap-2 transition-all duration-300"
                          onClick={() => setShowCountryList(!showCountryList)}
                        >
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-neutral-800">{selectedCountry.code}</span>
                          <svg
                            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${showCountryList ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Country Dropdown */}
                        {showCountryList && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 py-1 z-50">
                            {countryCodes.map((country) => (
                              <button
                                key={country.code}
                                className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                                onClick={() => handleCountrySelect(country)}
                              >
                                <span className="text-lg">{country.flag}</span>
                                <div>
                                  <p className="text-sm font-medium text-neutral-800">{country.country}</p>
                                  <p className="text-xs text-neutral-500">{country.code}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="tel"
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter your phone number"
                        className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:border-pink-500 focus:ring focus:ring-pink-200 transition-all duration-300 text-neutral-800 placeholder-neutral-400"
                        maxLength={10}
                      />
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">
                      We'll send you a one-time verification code
                    </p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-neutral-700 mb-2">
                      Verification Code
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="otp"
                        value={''}
                        onChange={(e) => handleOTPVerification(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-pink-500 focus:ring focus:ring-pink-200 transition-all duration-300 text-neutral-800 placeholder-neutral-400"
                        maxLength={6}
                      />
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-pink-600 hover:text-pink-700"
                        onClick={() => setShowOTP(false)}
                      >
                        Change Number
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">
                      Didn't receive the code? <button className="text-pink-600 hover:text-pink-700 font-medium">Resend OTP</button>
                    </p>
                  </div>
                )}

                <button
                  onClick={!showOTP ? handleSendOTP : undefined}
                  disabled={(!isValidPhoneNumber && !showOTP) || loading}
                  className={`w-full py-3.5 px-4 rounded-xl font-medium transition-all duration-300 ${
                    (isValidPhoneNumber || showOTP) && !loading
                      ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-700 hover:to-pink-600 active:scale-[0.98] shadow-sm'
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{showOTP ? 'Verifying...' : 'Sending OTP...'}</span>
                    </div>
                  ) : (
                    showOTP ? 'Verify OTP' : 'Continue'
                  )}
                </button>

                {error && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Bank Grade Security</span>
              </div>
              
              <p className="text-center text-sm text-neutral-500">
                By continuing, you agree to our{' '}
                <a href="#" className="text-pink-600 hover:text-pink-700">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-pink-600 hover:text-pink-700">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
