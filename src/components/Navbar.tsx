import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Menu, X, Play, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">StreamHub</span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/category/movies" className="hover:text-white transition-colors">Movies</Link>
              <Link to="/category/sports" className="hover:text-white transition-colors">Sports</Link>
              <Link to="/category/gaming" className="hover:text-white transition-colors">Gaming</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-neutral-900 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-rose-500 transition-colors w-64"
              />
            </form>

            {user ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link to="/admin" className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-white">
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-2 p-1 pl-1 pr-3 hover:bg-white/5 rounded-full transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-neutral-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{profile?.name}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-white">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-rose-500 transition-colors">Login</Link>
                <Link to="/signup" className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 rounded-full transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-neutral-400">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-neutral-950 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm"
                />
              </form>
              <div className="flex flex-col gap-2">
                <Link to="/" onClick={() => setIsOpen(false)} className="px-4 py-2 hover:bg-white/5 rounded-lg">Home</Link>
                <Link to="/category/movies" onClick={() => setIsOpen(false)} className="px-4 py-2 hover:bg-white/5 rounded-lg">Movies</Link>
                <Link to="/category/sports" onClick={() => setIsOpen(false)} className="px-4 py-2 hover:bg-white/5 rounded-lg">Sports</Link>
                <Link to="/category/gaming" onClick={() => setIsOpen(false)} className="px-4 py-2 hover:bg-white/5 rounded-lg">Gaming</Link>
              </div>
              <div className="pt-4 border-t border-white/5">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="px-4 py-2 hover:bg-white/5 rounded-lg flex items-center gap-3">
                      <User className="w-5 h-5" /> Profile
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)} className="px-4 py-2 hover:bg-white/5 rounded-lg flex items-center gap-3">
                        <LayoutDashboard className="w-5 h-5" /> Admin
                      </Link>
                    )}
                    <button onClick={handleLogout} className="px-4 py-2 hover:bg-white/5 rounded-lg flex items-center gap-3 text-left w-full">
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/login" onClick={() => setIsOpen(false)} className="px-4 py-2 text-center bg-neutral-900 rounded-lg">Login</Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)} className="px-4 py-2 text-center bg-rose-600 rounded-lg">Sign Up</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
