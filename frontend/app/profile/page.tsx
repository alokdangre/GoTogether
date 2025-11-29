'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  MapPinIcon,
  PencilIcon,
  CheckCircleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Car } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { useAuthStore } from '@/lib/store';
import { User } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [supportText, setSupportText] = useState('');
  const [supportTitle, setSupportTitle] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [isAuthenticated, user, router]);

  const handleSave = async () => {
    // TODO: Implement profile update API call
    toast('Profile update functionality to be implemented');
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  const handleSupportSubmit = async (type: 'issue' | 'feature') => {
    if (!supportTitle || !supportText) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/support/`, {
        type,
        title: supportTitle,
        description: supportText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Request submitted successfully');
      setShowIssueModal(false);
      setShowFeatureModal(false);
      setSupportTitle('');
      setSupportText('');
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  const handleCallRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/support/`, {
        type: 'call',
        title: 'Call Request',
        description: 'User requested a call back'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('It will be done soon');
    } catch (error) {
      toast.error('Failed to request call');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isDriver = user.role === 'driver' || user.role === 'both';
  const isRider = user.role === 'rider' || user.role === 'both';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="relative px-8 py-12 md:py-16">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center space-x-6 md:space-x-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon className="h-12 w-12 md:h-16 md:w-16 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{user.name || 'Anonymous User'}</h1>
                <div className="flex flex-wrap items-center gap-4 text-blue-100">
                  <span className="capitalize text-lg">{user.role} Account</span>
                  {user.rating && (
                    <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                      <StarIcon className="h-5 w-5 text-yellow-300 mr-2" />
                      <span className="font-semibold">{user.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    <CheckCircleIcon className="h-5 w-5 text-green-300 mr-2" />
                    <span>{user.is_verified ? 'Verified' : 'Unverified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-300/10 rounded-full blur-lg"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                <p className="text-gray-600 mt-1">Manage your account details and preferences</p>
              </div>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-blue-50 rounded-xl mr-4">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                    <p className="text-gray-600">Your personal details</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-900 font-medium">{user.name || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900 font-medium">{user.phone}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-gray-900 font-medium">{user.email || 'Not provided'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Status</label>
                    <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                      <div className={`w-4 h-4 rounded-full mr-3 ${user.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-gray-900 font-medium">
                        {user.is_verified ? 'Verified Account' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role-specific Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-purple-50 rounded-xl mr-4">
                    <Car className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Account Type</h3>
                    <p className="text-gray-600">Your role in the platform</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="mr-3">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
                          {user.role}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Active Role</p>
                        <p className="text-xs text-gray-600">You can participate as {isDriver && isRider ? 'both driver and rider' : isDriver ? 'a driver' : 'a rider'}</p>
                      </div>
                    </div>
                  </div>

                  {isDriver && (
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-blue-900">Driver Profile</h4>
                          <p className="text-sm text-blue-700">Manage your driving preferences</p>
                        </div>
                      </div>
                      <div className="text-sm text-blue-800 bg-blue-50 p-3 rounded-lg">
                        Driver features and profile management coming soon.
                      </div>
                    </div>
                  )}

                  {isRider && (
                    <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <MapPinIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-green-900">Rider Profile</h4>
                          <p className="text-sm text-green-700">Customize your riding experience</p>
                        </div>
                      </div>
                      <div className="text-sm text-green-800 bg-green-50 p-3 rounded-lg">
                        Rider preferences and profile management coming soon.
                      </div>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl text-center border border-indigo-200">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">{user.total_rides || 0}</div>
                        <div className="text-sm font-medium text-indigo-700">Total Trips</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center border border-purple-200">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{user.total_ratings || 0}</div>
                        <div className="text-sm font-medium text-purple-700">Total Ratings</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Account Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Need help? <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Contact Support</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Support Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Support & Feedback</h3>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSupportTitle('');
                    setSupportText('');
                    setShowIssueModal(true);
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Report an Issue
                </button>
                <button
                  onClick={() => {
                    setSupportTitle('');
                    setSupportText('');
                    setShowFeatureModal(true);
                  }}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Request Feature
                </button>
                <button
                  onClick={handleCallRequest}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  Request Call Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Issue Modal */}
        {showIssueModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Report an Issue</h3>
              <input
                type="text"
                placeholder="Issue Title"
                value={supportTitle}
                onChange={(e) => setSupportTitle(e.target.value)}
                className="w-full mb-4 px-4 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Describe the issue..."
                value={supportText}
                onChange={(e) => setSupportText(e.target.value)}
                className="w-full mb-4 px-4 py-2 border rounded-lg h-32"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSupportSubmit('issue')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Modal */}
        {showFeatureModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Request a Feature</h3>
              <input
                type="text"
                placeholder="Feature Title"
                value={supportTitle}
                onChange={(e) => setSupportTitle(e.target.value)}
                className="w-full mb-4 px-4 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Describe the feature..."
                value={supportText}
                onChange={(e) => setSupportText(e.target.value)}
                className="w-full mb-4 px-4 py-2 border rounded-lg h-32"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFeatureModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSupportSubmit('feature')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
