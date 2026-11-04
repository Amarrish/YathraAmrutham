import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Home } from './pages/Home';
import { TourDetails } from './pages/TourDetails';
import { BookingPage } from './pages/BookingPage';
import { UserDashboard } from './pages/UserDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Gallery } from './pages/Gallery';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageTours } from './pages/admin/ManageTours';
import { ManageBookings } from './pages/admin/ManageBookings';
import { ManageUsers } from './pages/admin/ManageUsers';
import { AdminSeatChart } from './pages/admin/AdminSeatChart';
import { ManageGallery } from './pages/admin/ManageGallery';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/tours/:id" element={<TourDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected User Routes */}
              <Route
                path="/book/:id"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tours"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ManageTours />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ManageBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ManageUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/seat-chart/:tourId"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminSeatChart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/gallery"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ManageGallery />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
