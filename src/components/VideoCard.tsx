import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, Clock, Calendar, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Video } from '../types';
import { motion } from 'motion/react';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<{ video: Video }> = ({ video }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative bg-neutral-900 rounded-xl overflow-hidden border border-white/5 hover:border-rose-500/30 transition-all shadow-lg"
    >
      <Link to={`/video/${video.id}`}>
        <div className="relative aspect-video overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
          
          {video.locked && (
            <div className="absolute top-2 right-2 bg-neutral-950/80 backdrop-blur-md p-1.5 rounded-full border border-white/10">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            </div>
          )}
          
          <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-white">
            {video.duration}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center shadow-2xl">
              <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
            </div>
          </div>
        </div>
        
        <div className="p-3">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-rose-500 transition-colors">
                {video.title}
              </h3>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
            <span className="bg-neutral-800 px-2 py-0.5 rounded uppercase font-bold tracking-wider text-[9px] text-neutral-300">
              {video.categoryId}
            </span>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{video.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDistanceToNow(video.createdAt)} ago</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VideoCard;
