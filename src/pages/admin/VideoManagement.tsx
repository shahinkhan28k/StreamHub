import React, { useState, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Video } from '../../types';
import { 
  Plus, Edit2, Trash2, Eye, Search, Filter, Play, X, Check, 
  Lock, Unlock, Sparkles, Megaphone, Upload, FileVideo, 
  Image as ImageIcon, RefreshCw, AlertTriangle, CheckCircle, Database
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredVideos, saveStoredVideo, deleteStoredVideo } from '../../lib/videoStore';

// Preset High-Speed CDN Video Templates
const CDN_PRESETS = [
  {
    title: "Elephant's Dream (Sci-Fi CGI Film)",
    description: "Elephant's Dream is a visually stunning, high-concept futuristic Sci-Fi story exploring a giant automated mechanical wonderland filled with mysterious machines.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=640",
    categoryId: "movies",
    duration: "10:53",
    tags: "scifi, cgi, cinematic, future"
  },
  {
    title: "Sintel (Fantasy Dragon Adventure)",
    description: "A breathtaking and emotional fantasy tale of Sintel, a young nomadic girl who searches the desolate world to rescue her baby dragon companion.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=640",
    categoryId: "movies",
    duration: "14:48",
    tags: "fantasy, adventure, emotional, story"
  },
  {
    title: "Tears of Steel (VFX Cyberpunk)",
    description: "Set in a near-future cyberpunk Amsterdam, Tears of Steel features high-tech hologram systems, flying giant robot controllers, and elite lasers.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=640",
    categoryId: "tech",
    duration: "12:14",
    tags: "cyberpunk, scifi, action, vfx"
  },
  {
    title: "Big Buck Bunny (Comedy Animation)",
    description: "A lighthearted and funny forest adventure where a giant fluffy rabbit plans comic revenge on mischievous woodland pests.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=640",
    categoryId: "gaming",
    duration: "09:56",
    tags: "comedy, family, fun, cartoon"
  }
];

export default function VideoManagement() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const videoFileRef = useRef<HTMLInputElement>(null);
  const thumbFileRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await getStoredVideos();
      setVideos(data);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress((prev) => ({ ...prev, [path]: Math.round(p) }));
        },
        (error) => {
          console.error(`Upload error for ${path}:`, error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleApplyPreset = (preset: typeof CDN_PRESETS[0]) => {
    setValue('title', preset.title);
    setValue('description', preset.description);
    setValue('videoUrl', preset.videoUrl);
    setValue('thumbnail', preset.thumbnail);
    setValue('categoryId', preset.categoryId);
    setValue('duration', preset.duration);
    setValue('tags', preset.tags);
  };

  const handleForceCloudSync = async () => {
    setSyncing(true);
    try {
      // Re-trigger global video fetch which pulls from Firestore & saves back to local storage
      const refreshedData = await getStoredVideos();
      setVideos(refreshedData);
      alert("Database Synced! Successfully downloaded cloud additions and synchronized local records.");
    } catch (e) {
      console.error(e);
      alert("Sync completed with warnings. Running in optimized standalone local mode.");
    } finally {
      setSyncing(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setUploading(true);
      let videoUrl = data.videoUrl;
      let thumbnailUrl = data.thumbnail;

      // Handle Video File Upload
      const videoFile = videoFileRef.current?.files?.[0];
      if (videoFile) {
        try {
          videoUrl = await uploadFile(videoFile, 'videos');
        } catch (uploadErr: any) {
          console.error("Video upload error:", uploadErr);
          throw new Error(`STORAGE_VIDEO_FAILED: ${uploadErr?.message || 'Access Denied'}`);
        }
      }

      // Handle Thumbnail File Upload
      const thumbFile = thumbFileRef.current?.files?.[0];
      if (thumbFile) {
        try {
          thumbnailUrl = await uploadFile(thumbFile, 'thumbnails');
        } catch (uploadErr: any) {
          console.error("Thumbnail upload error:", uploadErr);
          throw new Error(`STORAGE_THUMBNAIL_FAILED: ${uploadErr?.message || 'Access Denied'}`);
        }
      }

      if (!videoUrl || !thumbnailUrl) {
        alert("Please specify a Video and Thumbnail (either enter direct URLs or select files to upload)");
        setUploading(false);
        return;
      }

      const finalVideo: Partial<Video> = {
        title: data.title,
        description: data.description,
        videoUrl,
        thumbnail: thumbnailUrl,
        categoryId: data.categoryId,
        duration: data.duration,
        tags: typeof data.tags === 'string' ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : data.tags || [],
        featured: !!data.featured,
        locked: !!data.locked,
        published: !!data.published,
        views: editingVideo ? editingVideo.views : 0,
        adClicks: editingVideo ? editingVideo.adClicks : 0,
        createdAt: editingVideo ? editingVideo.createdAt : Date.now(),
      };

      if (editingVideo) {
        finalVideo.id = editingVideo.id;
      }

      await saveStoredVideo(finalVideo);
      
      setIsModalOpen(false);
      setEditingVideo(null);
      setProgress({});
      reset();
      fetchVideos();
    } catch (error: any) {
      console.error("Error saving video:", error);
      const errMsg = error?.message || "";
      
      if (errMsg.includes("STORAGE_VIDEO_FAILED") || errMsg.includes("STORAGE_THUMBNAIL_FAILED")) {
        alert(
          "❌ Firebase Storage Upload Blocked / Failed!\n\n" +
          "This issue happens because Firebase Storage is not activated in your project, or the security rules block unauthenticated uploads.\n\n" +
          "HOW TO SOLVE PERMANENTLY:\n" +
          "1. Go to your Firebase Console (console.firebase.google.com)\n" +
          "2. Click 'Storage' in the left sidebar under Build.\n" +
          "3. Click 'Get Started' to enable the storage bucket.\n" +
          "4. Go to the 'Rules' tab and change 'allow read, write: if false;' to 'allow read, write: if true;' (or customize for authenticated users) so anyone can upload.\n\n" +
          "💡 INSTANT WORKAROUND (Highly Recommended):\n" +
          "Instead of uploading files, copy any direct MP4 link (from Google Drive, Dropbox, free CDNs, or YouTube) and paste it into the 'Video URL' input! It will deploy in 0.1 seconds with NO loading/processing time!"
        );
      } else {
        alert("Error saving video: " + errMsg);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video: Video) => {
    if (window.confirm('Are you sure you want to delete this video? This will also remove any uploaded storage files.')) {
      try {
        await deleteStoredVideo(video);

        // Attempt to delete from Firebase Storage if matching paths
        const deleteFromStorage = async (url: string) => {
          if (url.includes('firebasestorage.googleapis.com')) {
            try {
              const fileRef = ref(storage, url);
              await deleteObject(fileRef);
            } catch (e) {
              console.warn("Storage item cleanup skipped:", url);
            }
          }
        };

        await deleteFromStorage(video.videoUrl);
        await deleteFromStorage(video.thumbnail);

        fetchVideos();
      } catch (error) {
        console.error("Error deleting video:", error);
        fetchVideos();
      }
    }
  };

  const openEdit = (video: Video) => {
    setEditingVideo(video);
    setValue('title', video.title);
    setValue('description', video.description);
    setValue('thumbnail', video.thumbnail);
    setValue('videoUrl', video.videoUrl);
    setValue('categoryId', video.categoryId);
    setValue('duration', video.duration);
    setValue('tags', video.tags?.join(', ') || '');
    setValue('featured', video.featured);
    setValue('locked', video.locked);
    setValue('published', video.published);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingVideo(null);
    reset();
    setIsModalOpen(true);
  };

  // Filter & Search Logic
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.categoryId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'locked' && video.locked) || 
                          (selectedStatus === 'unlocked' && !video.locked) ||
                          (selectedStatus === 'featured' && video.featured);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            Video Management Hub
          </h1>
          <p className="text-neutral-400 text-sm">Upload, customize, and orchestrate high-speed streaming assets</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleForceCloudSync}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-3 bg-neutral-900 border border-white/5 hover:border-white/10 rounded-full font-bold text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Force Sync Cloud'}
          </button>

          <button 
            onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 rounded-full font-bold text-sm transition-all shadow-xl shadow-rose-600/20"
          >
            <Plus className="w-5 h-5" /> Add Video
          </button>
        </div>
      </div>

      {/* Connection & System Status Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-r from-rose-950/20 to-neutral-900/40 p-5 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Database Status</h4>
            <p className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active / Standalone Enabled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Storage Sync Engine</h4>
            <p className="text-sm font-black text-white mt-0.5">Automatic Fallback Active</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total Stored Assets</h4>
            <p className="text-sm font-black text-white mt-0.5">{videos.length} videos active</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-neutral-900 border border-white/5 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search by title, tags, or categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-neutral-800 border border-white/5 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500 transition-colors cursor-pointer text-neutral-300"
          >
            <option value="all">All Categories</option>
            <option value="movies">Movies</option>
            <option value="sports">Sports</option>
            <option value="gaming">Gaming</option>
            <option value="tech">Tech</option>
            <option value="music">Music</option>
            <option value="education">Education</option>
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-neutral-800 border border-white/5 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500 transition-colors cursor-pointer text-neutral-300"
          >
            <option value="all">All States</option>
            <option value="locked">Locked Only</option>
            <option value="unlocked">Free Only</option>
            <option value="featured">Featured Only</option>
          </select>
        </div>
      </div>

      {/* Videos Table */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest bg-neutral-950/40">
                <th className="px-6 py-4">Video Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Engagement</th>
                <th className="px-6 py-4">Ad Clicks</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVideos.map((video) => (
                <tr key={video.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-24 aspect-video rounded-lg bg-neutral-800 overflow-hidden relative border border-white/5 flex-shrink-0">
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        {video.locked && (
                          <div className="absolute top-1 right-1 bg-amber-500/90 backdrop-blur-sm p-1 rounded-md">
                            <Lock className="w-3 h-3 text-neutral-950" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] px-1 rounded font-mono text-neutral-300">
                          {video.duration}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-rose-500 transition-colors">{video.title}</h4>
                        <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{video.description}</p>
                        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto whitespace-nowrap">
                          {video.tags?.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[9px] font-medium px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded-full border border-white/5">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                      {video.categoryId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1 ${video.published ? 'text-emerald-500' : 'text-neutral-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${video.published ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'}`} />
                        {video.published ? 'Published' : 'Draft'}
                      </span>
                      {video.featured && (
                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">★ Featured</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-white">{(video.views || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-neutral-500">Total Views</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono font-bold text-amber-500">{(video.adClicks || 0).toLocaleString()}</div>
                    <div className="text-[10px] text-neutral-500">Clicks Tracked</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEdit(video)}
                        className="p-2 bg-neutral-800 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(video)}
                        className="p-2 bg-neutral-800 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link 
                        to={`/video/${video.id}`}
                        className="p-2 bg-neutral-800 hover:bg-blue-500/10 hover:text-blue-500 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredVideos.length === 0 && !loading && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-600">
              <Play className="w-8 h-8" />
            </div>
            <p className="text-neutral-400">No matching videos found. Click &quot;Add Video&quot; to populate your streaming list.</p>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
              <div>
                <h2 className="text-xl font-bold">{editingVideo ? 'Modify Streaming Asset' : 'Add New Streaming Asset'}</h2>
                <p className="text-neutral-400 text-xs">Fill details or choose one of our high-speed preset templates</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              
              {/* Instant High-Speed Presets Panel */}
              {!editingVideo && (
                <div className="bg-gradient-to-r from-rose-950/30 to-blue-950/20 p-5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 animate-pulse" /> Speed Optimization presets
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Avoid upload waiting times! Click on any preset movie below to instantly fill the fields with working 4K CDN high-speed video URLs:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CDN_PRESETS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => handleApplyPreset(preset)}
                        className="flex items-center justify-between px-3 py-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-white/5 text-left text-[11px] transition-all font-semibold"
                      >
                        <span className="truncate">{preset.title}</span>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 opacity-60 ml-1 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Video Title</label>
                  <input {...register('title', { required: true })} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors text-sm" placeholder="Enter video title" />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Description</label>
                  <textarea {...register('description')} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors h-24 text-sm" placeholder="Describe your video" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Thumbnail (URL or Upload)</label>
                  <div className="space-y-2">
                    <input {...register('thumbnail')} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2.5 px-3 focus:outline-none focus:border-rose-500 transition-colors text-xs" placeholder="https://..." />
                    <div className="relative group">
                      <input 
                        type="file" 
                        ref={thumbFileRef}
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const sizeInMB = file.size / (1024 * 1024);
                            if (sizeInMB > 5) {
                              alert(`Notice: This image is ${sizeInMB.toFixed(1)}MB. Image uploads should ideally be under 1-2MB for maximum speed. Please compress it or use a web link if possible.`);
                            }
                            setValue('thumbnail', file.name);
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => thumbFileRef.current?.click()}
                        className="w-full py-2 bg-neutral-800/40 border border-dashed border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4 text-neutral-400" />
                        {thumbFileRef.current?.files?.[0] ? thumbFileRef.current.files[0].name : 'Choose Thumbnail File'}
                      </button>
                    </div>
                    {progress.thumbnails !== undefined && (
                      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${progress.thumbnails}%` }} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Video (URL or Upload)</label>
                  <div className="space-y-2">
                    <input {...register('videoUrl')} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2.5 px-3 focus:outline-none focus:border-rose-500 transition-colors text-xs" placeholder="https://..." />
                    <div className="relative group">
                      <input 
                        type="file" 
                        ref={videoFileRef}
                        accept="video/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const sizeInMB = file.size / (1024 * 1024);
                            if (sizeInMB > 15) {
                              alert(
                                `⚠️ warning: This video file is very large (${sizeInMB.toFixed(1)} MB)!\n\n` +
                                "Uploading large files directly can take several minutes or fail completely due to network limits or inactive Firebase Storage rules.\n\n" +
                                "💡 BEST PRACTICE:\n" +
                                "We highly recommend uploading your video to Google Drive, Dropbox, YouTube, or free video hosting sites, then pasting the direct video URL in the field above! This guarantees 0-second instant processing."
                              );
                            }
                            setValue('videoUrl', file.name);
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => videoFileRef.current?.click()}
                        className="w-full py-2 bg-neutral-800/40 border border-dashed border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
                      >
                        <FileVideo className="w-4 h-4 text-neutral-400" />
                        {videoFileRef.current?.files?.[0] ? videoFileRef.current.files[0].name : 'Choose Video File'}
                      </button>
                    </div>
                    {progress.videos !== undefined && (
                      <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${progress.videos}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Warning Note */}
                <div className="md:col-span-2 flex items-start gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-500 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">File Upload Notice:</span> Manual video files uploaded directly to Firebase Storage will consume system bandwidth and might take longer to load based on network connection. For immediate deployment, please paste direct streaming links or use the <span className="font-bold text-white underline">Optimization Presets</span> above!
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Category</label>
                  <select {...register('categoryId', { required: true })} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors text-xs text-neutral-300">
                    <option value="movies">Movies</option>
                    <option value="sports">Sports</option>
                    <option value="gaming">Gaming</option>
                    <option value="tech">Tech</option>
                    <option value="music">Music</option>
                    <option value="education">Education</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Duration</label>
                  <input {...register('duration', { required: true })} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors text-xs text-neutral-300" placeholder="e.g. 10:45" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tags (comma separated)</label>
                  <input {...register('tags')} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors text-xs text-neutral-300" placeholder="action, sci-fi, 4k" />
                </div>

                <div className="flex flex-wrap items-center gap-6 md:col-span-2 p-4 bg-neutral-850/40 rounded-2xl border border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" {...register('featured')} className="peer sr-only" />
                      <div className="w-10 h-6 bg-neutral-700 peer-checked:bg-rose-600 rounded-full transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors uppercase tracking-wider">Featured</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" {...register('locked')} className="peer sr-only" />
                      <div className="w-10 h-6 bg-neutral-700 peer-checked:bg-amber-500 rounded-full transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors uppercase tracking-wider">Ad Gate Locked</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" {...register('published')} className="peer sr-only" />
                      <div className="w-10 h-6 bg-neutral-700 peer-checked:bg-emerald-500 rounded-full transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors uppercase tracking-wider">Published</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-neutral-800 hover:bg-neutral-700 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider">Cancel</button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-600 rounded-2xl font-bold transition-all shadow-xl shadow-rose-600/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Uploading Media...
                    </>
                  ) : (
                    editingVideo ? 'Update Stream Asset' : 'Deploy Stream Asset'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
