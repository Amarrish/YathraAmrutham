import React from 'react';
import { Compass, Phone, Mail, MapPin, Shield } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Compass className="w-6 h-6 text-sky-400" />
              <span className="text-xl font-bold">WanderWise Tours</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Premium guided group tours, curated itineraries, modern AC vehicles, and seamless travel bookings across India.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
              <Shield className="w-3.5 h-3.5" />
              <span>Certified Travel Operator</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/" className="hover:text-white transition-colors">Featured Tours</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Customer Portal</a></li>
              <li><a href="/dashboard" className="hover:text-white transition-colors">Track Bookings</a></li>
            </ul>
          </div>

          {/* Popular destinations */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Top Destinations</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>South Indian Temples</li>
              <li>Vaccation Trips</li>
              <li>Ooty & Kodaikanal Hills</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support & Bookings</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-400" />
                <span>+91 9496962710 / 8129146601</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>bookings@yathramrutham.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} YathraAmruthm Tours & Travels. All rights reserved.</p>
          <p>Built By Ams</p>
        </div>
      </div>
    </footer>
  );
};
