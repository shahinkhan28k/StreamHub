import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Video } from '../types';
import VideoCard from '../components/VideoCard';
import { ChevronLeft, Play, Filter } from 'lucide-react';

export default function CategoryBrowse() {
  const { id } = useParams<{ id: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchVideos = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'videos'),
          where('categoryId', '==', id),
          where('published', '==', true)
        );
        const snapshot = await getDocs(q);
        setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
      } catch (error) {
        console.error("Error fetching category videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight capitalize">{id}</h1>
            <p className="text-neutral-400 text-sm">Discover the best {id} content on StreamHub</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 border border-white/5 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-video bg-neutral-900 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center">
            <Play className="w-10 h-10 text-neutral-600" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold">No videos yet</h3>
            <p className="text-neutral-400">There are currently no videos in the {id} category.</p>
          </div>
          <Link to="/" className="px-8 py-3 bg-rose-600 rounded-full font-bold">Explore Home</Link>
        </div>
      )}
    </div>
  );
}
