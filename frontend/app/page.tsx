'use client';

import { useRouter } from 'next/navigation';
import { MapPinIcon, BellIcon, ClockIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              GoTogether
            </h1>
            <p className="text-xl sm:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
              Affordable shared rides, managed for you
            </p>
            <button
              onClick={() => router.push('/request-ride')}
              className="inline-flex items-center px-8 py-4 bg-white text-green-700 rounded-2xl font-semibold text-lg hover:bg-green-50 transition-all shadow-2xl transform hover:scale-105"
            >
              <MapPinIcon className="h-6 w-6 mr-2" />
              Request a Ride
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: '1',
              icon: MapPinIcon,
              title: 'Request Your Ride',
              description: 'Tell us where you want to go and when',
              color: 'blue'
            },
            {
              step: '2',
              icon: ClockIcon,
              title: 'We Group Riders',
              description: 'Our admin groups requests going the same way',
              color: 'purple'
            },
            {
              step: '3',
              icon: BellIcon,
              title: 'Get Notified',
              description: 'Receive ride details and accept or reject',
              color: 'yellow'
            },
            {
              step: '4',
              icon: CurrencyRupeeIcon,
              title: 'Save Money',
              description: 'Enjoy affordable rides and track your savings',
              color: 'green'
            }
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${item.color}-100 rounded-xl mb-4`}>
                  <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                </div>
                <div className={`absolute -top-3 -left-3 w-8 h-8 bg-${item.color}-600 text-white rounded-full flex items-center justify-center font-bold`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose GoTogether?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Save Money',
                description: 'Pay less than regular fares by sharing rides with others going your way',
                icon: '💰'
              },
              {
                title: 'Hassle-Free',
                description: 'We handle the grouping and driver assignment - you just request and ride',
                icon: '✨'
              },
              {
                title: 'Track Savings',
                description: 'See exactly how much you save on every ride compared to regular prices',
                icon: '📊'
              }
            ].map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Request your first ride today and see the difference
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/request-ride')}
              className="px-8 py-4 bg-white text-green-700 rounded-2xl font-semibold text-lg hover:bg-green-50 transition-all shadow-xl"
            >
              Request a Ride
            </button>
            <button
              onClick={() => router.push('/my-rides')}
              className="px-8 py-4 bg-green-800 text-white rounded-2xl font-semibold text-lg hover:bg-green-900 transition-all"
            >
              View My Rides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
