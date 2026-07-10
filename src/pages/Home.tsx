import React, { useState, useEffect } from 'react';
import { Play, Info, ChevronRight, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { motion } from 'motion/react';
import { useSEO } from '../hooks/useSEO';
import { getStoredVideos } from '../lib/videoStore';

export default function Home() {
  useSEO('Home - Premium Video Streaming', 'Stream the latest movies, sports, and gaming content on StreamHub.');
  const [featuredVideo, setFeaturedVideo] = useState<Video | null>(null);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [latestVideos, setLatestVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allVideos = await getStoredVideos();
        const publishedVideos = allVideos.filter(v => v.published);

        // Featured
        const featured = publishedVideos.find(v => v.featured);
        if (featured) {
          setFeaturedVideo(featured);
        } else if (publishedVideos.length > 0) {
          setFeaturedVideo(publishedVideos[0]);
        }

        // Trending (Sorted by views)
        const trending = [...publishedVideos].sort((a, b) => b.views - a.views).slice(0, 6);
        setTrendingVideos(trending);

        // Latest (Sorted by date)
        const latest = [...publishedVideos].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
        setLatestVideos(latest);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching home data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      {featuredVideo && (
        <section className="relative h-[80vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={featuredVideo.thumbnail} 
              alt={featuredVideo.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/20 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 lg:p-24">
            <div className="max-w-3xl space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-600/30 text-rose-500 text-xs font-bold uppercase tracking-widest"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Featured Content
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
              >
                {featuredVideo.title}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-neutral-300 line-clamp-3 md:line-clamp-none max-w-2xl"
              >
                {featuredVideo.description}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 pt-4"
              >
                <Link 
                  to={`/video/${featuredVideo.id}`}
                  className="flex items-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-700 rounded-full font-bold transition-all hover:scale-105 shadow-xl shadow-rose-600/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </Link>
                <Link 
                  to={`/video/${featuredVideo.id}`}
                  className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full font-bold transition-all"
                >
                  <Info className="w-5 h-5" />
                  More Info
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Trending Now</h2>
          </div>
          <Link to="/search" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trendingVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-y border-white/5 bg-neutral-900/30">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {['Movies', 'Sports', 'Gaming', 'Music', 'Tech'].map((cat) => (
            <Link 
              key={cat}
              to={`/category/${cat.toLowerCase()}`}
              className="group relative h-24 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-rose-500/50 transition-all flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative font-bold tracking-wide uppercase text-xs group-hover:scale-110 transition-transform">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Uploads */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/10 rounded-lg">
              <Clock className="w-6 h-6 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Latest Uploads</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {latestVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
}
