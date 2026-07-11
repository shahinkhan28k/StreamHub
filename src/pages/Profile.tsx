import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Clock, Heart, History, LogOut, ChevronLeft } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { motion } from 'motion/react';

export default function Profile() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Video[]>([]);
  const [history, setHistory] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        // Mocking favorites and history fetch (actual impl would query subcollections)
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, where('published', '==', true), limit(4));
        const snap = await getDocs(q);
        const videoList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
        
        setFavorites(videoList);
        setHistory(videoList);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  if (!user || !profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Modern Back Button */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-full text-xs font-bold text-neutral-300 hover:text-white transition-all shadow-xl"
        >
          <ChevronLeft className="w-4 h-4 text-rose-500" />
          <span>ফিরে যান (Go Back)</span>
        </button>
      </div>

      {/* Profile Header */}
      <section className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-32 h-32 rounded-3xl bg-neutral-800 flex items-center justify-center overflow-hidden border-4 border-neutral-800 shadow-xl">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-neutral-600" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1">{profile.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-400">
                <div className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile.email}</div>
                <div className="flex items-center gap-1.5">
                  <Shield className={`w-4 h-4 ${isAdmin ? 'text-rose-500' : 'text-neutral-500'}`} /> 
                  {isAdmin ? 'Administrator' : 'Standard Member'}
                </div>
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Joined July 2026</div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {isAdmin && (
                <Link to="/admin" className="px-6 py-2 bg-rose-600 hover:bg-rose-700 rounded-full text-sm font-bold transition-all flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Admin Panel
                </Link>
              )}
              <button className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-sm font-bold transition-all">
                Edit Profile
              </button>
              <button onClick={handleLogout} className="px-6 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 rounded-full text-sm font-bold transition-all flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Favorite Videos */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Heart className="w-6 h-6 text-rose-500 fill-current" /> Favorite Videos
            </h2>
            <Link to="/search" className="text-sm text-neutral-500 hover:text-white">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {favorites.map(v => <VideoCard key={v.id} video={v} />)}
            {favorites.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center bg-neutral-900/50 rounded-2xl border border-dashed border-white/5 text-neutral-500 italic">
                No favorites yet.
              </div>
            )}
          </div>
        </section>

        {/* Watch History */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <History className="w-6 h-6 text-neutral-400" /> Watch History
            </h2>
            <button className="text-sm text-neutral-500 hover:text-white">Clear</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {history.map(v => <VideoCard key={v.id} video={v} />)}
            {history.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center bg-neutral-900/50 rounded-2xl border border-dashed border-white/5 text-neutral-500 italic">
                Your history is empty.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
