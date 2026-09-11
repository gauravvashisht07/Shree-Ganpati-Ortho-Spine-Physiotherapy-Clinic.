import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/admin/Dashboard';
import BodyMapHero from './components/home/BodyMapHero';
import ServicesGrid from './components/home/ServicesGrid';
import SlotPicker from './components/booking/SlotPicker';
import MyAppointments from './pages/patient/MyAppointments';
import Schedule from './pages/doctor/Schedule';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import DoctorProfile from './pages/DoctorProfile';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';

const queryClient = new QueryClient();

import BookingPreview from './components/home/BookingPreview';
import ReviewsSection from './components/home/ReviewsSection';
import LocationSection from './components/home/LocationSection';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function Home() {
  return (
    <div className="font-body text-[#221B26] bg-[#FAF6F0] min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        <BodyMapHero />
        <ServicesGrid />
        <BookingPreview />
        <ReviewsSection />
        <LocationSection />
      </main>

      <Footer />
    </div>
  );
}

import AdminLogin from './pages/admin/AdminLogin';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/doctors/:id" element={<DoctorProfile />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin" 
              element={
                <AdminProtectedRoute>
                  <Dashboard />
                </AdminProtectedRoute>
              } 
            />
            <Route path="/book" element={<SlotPicker />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/schedule" element={<Schedule />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
