import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { seedDatabase } from './lib/seed';
import Home from './pages/Home';
import VideoDetail from './pages/VideoDetail';
import Search from './pages/Search';
import CategoryBrowse from './pages/CategoryBrowse';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import VideoManagement from './pages/admin/VideoManagement';
import SiteSettingsPage from './pages/admin/SiteSettingsPage';
import UserManagement from './pages/admin/UserManagement';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" />;

  return <>{children}</>;
};

const AppContent = () => {
  useEffect(() => {
    // Seed database if empty (safe to call, checks itself)
    seedDatabase().catch(err => {
      if (err.code === 'permission-denied') {
        console.log("Seeding skipped: User is not authorized. This is expected for non-admin users.");
      } else {
        console.error("Seed error:", err);
      }
    });
  }, []);

  return (
    <Router>
      <div className="min-h-screen w-full overflow-x-hidden relative bg-neutral-950 text-white selection:bg-rose-500 selection:text-white">
        <Navbar />
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/video/:id" element={<VideoDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/category/:id" element={<CategoryBrowse />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/videos" element={
              <ProtectedRoute adminOnly>
                <VideoManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute adminOnly>
                <SiteSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly>
                <UserManagement />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
