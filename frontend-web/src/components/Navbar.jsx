import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, User, LogOut, Shield, Menu, X, CalendarCheck, MapPin } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                Yathra<span className="text-sky-600">Amrutham</span>
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-teal-600 ml-1.5 px-1.5 py-0.5 bg-teal-50 rounded">
                Travel Services
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              to="/"
              className={`transition-colors ${isActive('/') ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Explore Tours
            </Link>

            {isAuthenticated && !isAdmin && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 transition-colors ${isActive('/dashboard') ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <CalendarCheck className="w-4 h-4 text-sky-500" />
                My Dashboard & Bookings
              </Link>
            )}

            {isAdmin && (
              <div className="flex items-center gap-4 pl-2 border-l border-slate-200">
                <Link
                  to="/admin"
                  className={`flex items-center gap-1 transition-colors ${isActive('/admin') ? 'text-amber-600 font-semibold' : 'text-slate-600 hover:text-amber-600'
                    }`}
                >
                  <Shield className="w-4 h-4 text-amber-500" />
                  Overview
                </Link>
                <Link
                  to="/admin/tours"
                  className={`transition-colors ${isActive('/admin/tours') ? 'text-amber-600 font-semibold' : 'text-slate-600 hover:text-amber-600'
                    }`}
                >
                  Manage Tours
                </Link>
                <Link
                  to="/admin/bookings"
                  className={`transition-colors ${isActive('/admin/bookings') ? 'text-amber-600 font-semibold' : 'text-slate-600 hover:text-amber-600'
                    }`}
                >
                  Bookings & Payments
                </Link>
                <Link
                  to="/admin/users"
                  className={`transition-colors ${isActive('/admin/users') ? 'text-amber-600 font-semibold' : 'text-slate-600 hover:text-amber-600'
                    }`}
                >
                  Users & Passwords
                </Link>
              </div>
            )}
          </nav>

          {/* User Auth Buttons / Profile */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pl-3 py-1.5 pr-2 bg-slate-100 rounded-full border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col text-left pr-2">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-800 hover:text-sky-600"
          >
            Explore Tours
          </Link>
          {isAuthenticated && !isAdmin && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-800 hover:text-sky-600"
            >
              My Dashboard & Bookings
            </Link>
          )}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Admin Control</span>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-sm text-slate-700">Overview</Link>
              <Link to="/admin/tours" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-sm text-slate-700">Manage Tours</Link>
              <Link to="/admin/bookings" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-sm text-slate-700">Bookings & Payments</Link>
              <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-sm text-slate-700">Users & Passwords</Link>
            </div>
          )}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-semibold text-slate-800">
                  {user?.name} ({user?.role})
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-sm text-rose-600 font-semibold"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
