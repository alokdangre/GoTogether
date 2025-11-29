'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { CarIcon, UserIcon, PlusIcon, BellIcon, Menu, X, MapPin } from 'lucide-react';
import { PhoneIcon, FlagIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

import { useAuthStore } from '@/lib/store';

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [supportText, setSupportText] = useState('');
  const [supportTitle, setSupportTitle] = useState('');

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
      setIsMobileMenuOpen(false);
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
      setIsMobileMenuOpen(false);
    } catch (error) {
      toast.error('Failed to request call');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    ...(isAuthenticated ? [
      { href: '/request-ride', label: 'Request Ride', icon: PlusIcon },
      { href: '/my-rides', label: 'My Rides', icon: CarIcon },
    ] : []),
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 z-50">
            <CarIcon className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">GoTogether</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium transition-colors ${pathname === link.href
                  ? 'text-blue-600 bg-blue-50 rounded-lg'
                  : 'text-gray-700 hover:text-blue-600'
                  }`}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/notifications"
                  className={`p-2 rounded-full transition-colors ${pathname === '/notifications'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                  title="Notifications"
                >
                  <BellIcon className="h-5 w-5" />
                </Link>

                <div className="h-6 w-px bg-gray-200" />

                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name || 'User'}
                  </span>
                  <Link
                    href="/profile"
                    className={`p-2 rounded-full transition-colors ${pathname === '/profile'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                      }`}
                    title="Profile"
                  >
                    <UserIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center z-50">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full pt-20 pb-6 px-6">
          {isAuthenticated && (
            <div className="mb-8 pb-8 border-b border-gray-100">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.phone}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${pathname === link.href
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {link.icon && <link.icon className="h-5 w-5" />}
                <span>{link.label}</span>
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <Link
                  href="/notifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/notifications'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <BellIcon className="h-5 w-5" />
                  <span>Notifications</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/profile'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
              </>
            )}
          </nav>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    setSupportTitle('');
                    setSupportText('');
                    setShowIssueModal(true);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <FlagIcon className="h-5 w-5" />
                  <span>Report Issue</span>
                </button>
                <button
                  onClick={() => {
                    setSupportTitle('');
                    setSupportText('');
                    setShowFeatureModal(true);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  <span>Request Feature</span>
                </button>
                <button
                  onClick={handleCallRequest}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors font-medium"
                >
                  <PhoneIcon className="h-5 w-5" />
                  <span>Request Call Back</span>
                </button>
                <div className="h-px bg-gray-100 my-2" />
              </>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
              >
                <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200"
              >
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
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
    </header>
  );
}
