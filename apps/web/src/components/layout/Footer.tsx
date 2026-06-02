import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-navy">Crewora</span>
            </div>
            <p className="text-gray-body text-sm leading-relaxed max-w-xs">
              The fastest way to find trusted blue-collar workers near you. No middlemen. No confusion.
            </p>
          </div>

          {/* For Customers */}
          <div>
            <h4 className="text-sm font-semibold text-navy mb-4">For Customers</h4>
            <ul className="space-y-2 text-sm text-gray-body">
              <li><Link href="/customer/register" className="hover:text-primary-500 transition-colors">Post a Job</Link></li>
              <li><Link href="/workers" className="hover:text-primary-500 transition-colors">Find Workers</Link></li>
              <li><Link href="/customer/login" className="hover:text-primary-500 transition-colors">Customer Login</Link></li>
            </ul>
          </div>

          {/* For Workers */}
          <div>
            <h4 className="text-sm font-semibold text-navy mb-4">For Workers</h4>
            <ul className="space-y-2 text-sm text-gray-body">
              <li><Link href="/for-workers" className="hover:text-primary-500 transition-colors">Join as Crew</Link></li>
              <li><Link href="/worker/register" className="hover:text-primary-500 transition-colors">Worker Registration</Link></li>
              <li><Link href="/worker/login" className="hover:text-primary-500 transition-colors">Worker Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-border mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-caption">
            © 2026 Crewora. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-gray-body">
            <Link href="/privacy" className="hover:text-primary-500 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
