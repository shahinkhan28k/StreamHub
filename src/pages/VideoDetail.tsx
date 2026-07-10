import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings, 
  ChevronLeft, Share2, Heart, ThumbsUp, MessageSquare, 
  Lock, ExternalLink, FastForward, Rewind, Megaphone,
  Gamepad2, Download, Send, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { doc, getDoc, updateDoc, increment, collection, query, where, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Video, Comment, SiteSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import VideoCard from '../components/VideoCard';
import { getSingleStoredVideo, getStoredVideos } from '../lib/videoStore';

// Helper to extract iframe / embed URL for standard cloud-hosted platforms
function getEmbedUrl(url: string) {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube Links
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
  }
  
  // Google Drive Shared Links
  if (trimmed.includes('drive.google.com')) {
    const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
  }

  // Vimeo Links
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
  }

  // Already an embedded URL (like DailyMotion iframe or other custom embed)
  if (trimmed.includes('/embed/') || trimmed.includes('/preview') || trimmed.includes('player.')) {
    return trimmed;
  }

  return null;
}

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLockedScreen, setShowLockedScreen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [hasClickedAd, setHasClickedAd] = useState(false);
  const [activeAdCampaign, setActiveAdCampaign] = useState<string | null>(null);
  const timerInterval = useRef<number | null>(null);
  
  // Video Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<number | null>(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchVideoAndSettings = async () => {
      setLoading(true);
      try {
        // Fetch Settings (Fallback to rich default setup)
        let settings: SiteSettings | null = null;
        try {
          const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
          if (settingsSnap.exists()) {
            settings = settingsSnap.data() as SiteSettings;
          }
        } catch (e) {
          console.warn("Could not read remote settings, using local settings defaults");
        }

        const defaultAdConfig = {
          enabled: true,
          directLink: 'https://example.com/adsterra-direct',
          socialBarScript: '',
          popunderScript: '',
          timerSeconds: 10,
          promoTitle1: 'Free Fire Arena',
          promoDesc1: 'Install & play for 30s to unlock video instantly!',
          promoLink1: 'https://example.com/free-fire-promo',
          promoIcon1: 'game',
          promoTitle2: 'Super VPN Premium',
          promoDesc2: 'Secure your browsing with zero log VPN. Fast & Free!',
          promoLink2: 'https://example.com/vpn-promo',
          promoIcon2: 'download',
          promoTitle3: 'Join Movie Channel',
          promoDesc3: 'Subscribe to our Official Telegram for premium collections!',
          promoLink3: 'https://telegram.org',
          promoIcon3: 'telegram'
        };

        if (!settings) {
          settings = {
            siteName: 'StreamHub',
            primaryColor: '#e11d48',
            footerText: '© 2026 StreamHub. All rights reserved.',
            contactEmail: 'admin@streamhub.io',
            socialLinks: { twitter: '', facebook: '', instagram: '', youtube: '' },
            featureToggles: { lockedVideoScreen: true, darkMode: true },
            adConfig: defaultAdConfig
          };
        } else {
          // If adConfig is missing or some fields are empty strings/undefined, merge with defaults
          if (!settings.adConfig) {
            settings.adConfig = defaultAdConfig;
          } else {
            settings.adConfig = {
              ...defaultAdConfig,
              ...settings.adConfig
            };

            // Ensure empty strings fallback to default content so buttons are never blank
            if (!settings.adConfig.directLink) {
              settings.adConfig.directLink = defaultAdConfig.directLink;
            }
            if (!settings.adConfig.promoTitle1) {
              settings.adConfig.promoTitle1 = defaultAdConfig.promoTitle1;
              settings.adConfig.promoDesc1 = defaultAdConfig.promoDesc1;
              settings.adConfig.promoLink1 = defaultAdConfig.promoLink1;
            }
            if (!settings.adConfig.promoTitle2) {
              settings.adConfig.promoTitle2 = defaultAdConfig.promoTitle2;
              settings.adConfig.promoDesc2 = defaultAdConfig.promoDesc2;
              settings.adConfig.promoLink2 = defaultAdConfig.promoLink2;
            }
            if (!settings.adConfig.promoTitle3) {
              settings.adConfig.promoTitle3 = defaultAdConfig.promoTitle3;
              settings.adConfig.promoDesc3 = defaultAdConfig.promoDesc3;
              settings.adConfig.promoLink3 = defaultAdConfig.promoLink3;
            }
          }
        }

        setSiteSettings(settings);

        // Inject scripts if enabled
        if (settings.adConfig?.enabled) {
          if (settings.adConfig.socialBarScript) {
            const script = document.createElement('script');
            script.innerHTML = settings.adConfig.socialBarScript;
            document.body.appendChild(script);
          }
          if (settings.adConfig.popunderScript) {
            const script = document.createElement('script');
            script.innerHTML = settings.adConfig.popunderScript;
            document.body.appendChild(script);
          }
        }

        // Fetch Single Video from unified, resilient videoStore
        const videoData = await getSingleStoredVideo(id);
        
        if (videoData) {
          setVideo(videoData);
          
          if (videoData.locked && !isUnlocked && settings?.adConfig?.enabled) {
            setShowLockedScreen(true);
            setAdTimer(settings.adConfig.timerSeconds || 10);
          }

          // Try to increment views in remote database
          try {
            const docRef = doc(db, 'videos', id);
            await updateDoc(docRef, { views: increment(1) });
          } catch (e) {
            console.warn("Could not increment view in remote Firestore, operating in standalone mode");
          }

          // Fetch related videos from resilient videoStore
          const allStoredVideos = await getStoredVideos();
          const related = allStoredVideos
            .filter(v => v.categoryId === videoData.categoryId && v.id !== id && v.published)
            .slice(0, 6);
          setRelatedVideos(related);

          // Fetch comments
          try {
            const commentsQ = query(collection(db, 'videos', id, 'comments'), limit(50));
            const commentsSnap = await getDocs(commentsQ);
            if (!commentsSnap.empty) {
              setComments(commentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
            } else {
              // Read local comments fallback
              const cached = localStorage.getItem(`comments_${id}`);
              if (cached) setComments(JSON.parse(cached));
            }
          } catch (e) {
            console.warn("Firestore comments unavailable, loading locally");
            const cached = localStorage.getItem(`comments_${id}`);
            if (cached) setComments(JSON.parse(cached));
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Error loading fail-safe video details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoAndSettings();
    window.scrollTo(0, 0);
  }, [id, navigate, isUnlocked]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      setIsMuted(v === 0);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.parentElement?.requestFullscreen();
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !id) return;

    try {
      const commentData = {
        videoId: id,
        userId: user.uid,
        userName: profile?.name || 'Anonymous',
        userAvatar: profile?.avatar || '',
        text: newComment,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'videos', id, 'comments'), commentData);
      setComments([{ id: docRef.id, ...commentData }, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const startAdTimer = () => {
    if (timerInterval.current) return;
    
    timerInterval.current = window.setInterval(() => {
      setAdTimer(prev => {
        if (prev <= 1) {
          if (timerInterval.current) clearInterval(timerInterval.current);
          timerInterval.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePromoClick = async (url: string | undefined, campaignTitle: string) => {
    if (!url) return;
    
    // Increment ad clicks in DB
    if (video) {
      try {
        await updateDoc(doc(db, 'videos', video.id), { adClicks: increment(1) });
      } catch (e) {
        console.warn("Could not increment adClicks in Firestore, incrementing locally");
      }
      video.adClicks = (video.adClicks || 0) + 1;
    }

    setActiveAdCampaign(campaignTitle);
    window.open(url, '_blank');
    setHasClickedAd(true);
    setAdTimer(siteSettings?.adConfig?.timerSeconds || 10);
    startAdTimer();
  };

  const handleUnlockContent = () => {
    if (adTimer === 0 && hasClickedAd) {
      setIsUnlocked(true);
      setShowLockedScreen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-neutral-400 gap-4">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Loading Premium Player...</p>
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Player Container */}
        <div className="relative aspect-video bg-neutral-950 rounded-3xl overflow-hidden group shadow-2xl border border-white/5">
          {showLockedScreen ? (
            <div className="absolute inset-0 z-20 bg-neutral-950 flex flex-col items-center justify-center p-4 md:p-6 text-center select-none overflow-y-auto">
              {!hasClickedAd ? (
                <div className="w-full max-w-2xl flex flex-col items-center justify-center h-full">
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-2 animate-pulse">
                    <Lock className="w-3.5 h-3.5" /> Premium Sponsor Gate
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Select an Offer to Unlock Video</h2>
                  <p className="text-neutral-400 text-xs md:text-sm max-w-md mt-1 mb-4 leading-relaxed">
                    Choose any of our trusted partners below. The premium streaming content will unlock immediately after completion!
                  </p>
                  
                  {/* Offers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {/* Adsterra Direct Link */}
                    {siteSettings?.adConfig?.directLink && (
                      <button 
                        onClick={() => handlePromoClick(siteSettings?.adConfig?.directLink, 'Sponsor Fast Link')}
                        className="flex items-center gap-3 p-3 bg-neutral-900 hover:bg-neutral-800/80 border border-white/5 hover:border-amber-500/40 rounded-2xl text-left transition-all hover:scale-[1.02] duration-200 group"
                      >
                        <div className="p-2.5 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform">
                          <Megaphone className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            Sponsor Fast Link <ExternalLink className="w-3 h-3 text-neutral-500" />
                          </h4>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">Quickly unlock using sponsor fast redirect.</p>
                        </div>
                      </button>
                    )}

                    {/* Promo Campaign 1 */}
                    {siteSettings?.adConfig?.promoTitle1 && (
                      <button 
                        onClick={() => handlePromoClick(siteSettings?.adConfig?.promoLink1, siteSettings?.adConfig?.promoTitle1 || 'Offer 1')}
                        className="flex items-center gap-3 p-3 bg-neutral-900 hover:bg-neutral-800/80 border border-white/5 hover:border-rose-500/40 rounded-2xl text-left transition-all hover:scale-[1.02] duration-200 group"
                      >
                        <div className="p-2.5 bg-rose-500/10 rounded-xl group-hover:scale-110 transition-transform">
                          <Gamepad2 className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            {siteSettings.adConfig.promoTitle1} <ExternalLink className="w-3 h-3 text-neutral-500" />
                          </h4>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{siteSettings.adConfig.promoDesc1 || 'Install and launch mobile application.'}</p>
                        </div>
                      </button>
                    )}

                    {/* Promo Campaign 2 */}
                    {siteSettings?.adConfig?.promoTitle2 && (
                      <button 
                        onClick={() => handlePromoClick(siteSettings?.adConfig?.promoLink2, siteSettings?.adConfig?.promoTitle2 || 'Offer 2')}
                        className="flex items-center gap-3 p-3 bg-neutral-900 hover:bg-neutral-800/80 border border-white/5 hover:border-blue-500/40 rounded-2xl text-left transition-all hover:scale-[1.02] duration-200 group"
                      >
                        <div className="p-2.5 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                          <Download className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            {siteSettings.adConfig.promoTitle2} <ExternalLink className="w-3 h-3 text-neutral-500" />
                          </h4>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{siteSettings.adConfig.promoDesc2 || 'Download recommended premium app.'}</p>
                        </div>
                      </button>
                    )}

                    {/* Promo Campaign 3 */}
                    {siteSettings?.adConfig?.promoTitle3 && (
                      <button 
                        onClick={() => handlePromoClick(siteSettings?.adConfig?.promoLink3, siteSettings?.adConfig?.promoTitle3 || 'Offer 3')}
                        className="flex items-center gap-3 p-3 bg-neutral-900 hover:bg-neutral-800/80 border border-white/5 hover:border-emerald-500/40 rounded-2xl text-left transition-all hover:scale-[1.02] duration-200 group"
                      >
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                          <Send className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            {siteSettings.adConfig.promoTitle3} <ExternalLink className="w-3 h-3 text-neutral-500" />
                          </h4>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{siteSettings.adConfig.promoDesc3 || 'Join group or follow telegram channel.'}</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-16 h-16 rounded-full border-4 border-neutral-800 border-t-rose-500 animate-spin flex items-center justify-center relative mb-4">
                    <span className="absolute text-lg font-black text-rose-500">{adTimer}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Unlocking Premium Stream
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                    Verifying interaction with <span className="text-rose-500 font-bold">{activeAdCampaign}</span>. Content unlocks immediately as soon as the sponsor timer reaches zero!
                  </p>

                  <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
                    <button 
                      onClick={handleUnlockContent}
                      disabled={adTimer > 0}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-neutral-950 rounded-xl font-bold transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2 text-sm"
                    >
                      {adTimer > 0 ? (
                        `Waiting for partner... ${adTimer}s`
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Watch Now
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => setHasClickedAd(false)} 
                      className="text-[11px] text-neutral-500 hover:text-neutral-300 font-semibold transition-colors mt-2"
                    >
                      ← Back to Offerwall
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full group bg-black overflow-hidden rounded-2xl" onMouseMove={() => setShowControls(true)}>
              {getEmbedUrl(video.videoUrl) ? (
                <div className="w-full h-full relative">
                  <iframe
                    src={getEmbedUrl(video.videoUrl)!}
                    className="w-full h-full border-0 absolute inset-0 z-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                  />
                  {/* Floating Back Button for Iframe Embeds */}
                  <div className="absolute top-4 left-4 z-10">
                    <Link to="/" className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-colors flex items-center justify-center">
                      <ChevronLeft className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  {video.videoUrl ? (
                    <video
                      ref={videoRef}
                      src={video.videoUrl}
                      poster={video.thumbnail}
                      className="w-full h-full object-contain"
                      preload="auto"
                      playsInline
                      webkit-playsinline="true"
                      crossOrigin="anonymous"
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setIsPlaying(false)}
                      onClick={togglePlay}
                      onLoadedMetadata={() => setVideoError(false)}
                      onError={(e) => {
                        console.error("Video element loading error:", e);
                        setVideoError(true);
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-neutral-500">
                      <Play className="w-12 h-12 mb-4 opacity-20" />
                      <p>Video source not available</p>
                    </div>
                  )}

                  {/* Diagnostic / Fail-safe Fallback Overlay for direct files */}
                  {videoError && video.videoUrl && (
                    <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                      <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                        <ShieldAlert className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">Direct Stream Error</h4>
                      <p className="text-[11px] text-neutral-400 mt-2 max-w-md leading-relaxed">
                        Your browser blocked direct streaming of this file due to missing storage CORS headers, a slow network, or unsupported video codecs.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full max-w-xs">
                        <a 
                          href={video.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Direct Link
                        </a>
                        <button 
                          onClick={() => {
                            if (videoRef.current) {
                              // Bypass custom engine and use native HTML5 players
                              videoRef.current.controls = true;
                              videoRef.current.load();
                              videoRef.current.play().catch(() => {});
                            }
                            setVideoError(false);
                          }}
                          className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Show Standard Player
                        </button>
                      </div>
                      <p className="text-[9px] text-neutral-500 mt-4">
                        💡 Admin Tip: Upload video to YouTube or Google Drive & paste the link for 100% playability!
                      </p>
                    </div>
                  )}
                  
                  {/* Custom Controls Overlay (Only for non-embed files) */}
                  <AnimatePresence>
                    {showControls && !videoError && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-end p-4 transition-opacity"
                      >
                        {/* Top Controls */}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <Link to="/" className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                          </Link>
                        </div>

                        {/* Bottom Controls */}
                        <div className="space-y-4">
                          {/* Progress Bar */}
                          <div className="group/progress relative h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden">
                            <div 
                              className="absolute h-full bg-rose-600 rounded-full transition-all duration-100"
                              style={{ width: `${progress}%` }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={progress}
                              onChange={handleSeek}
                              className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                              </button>
                              
                              <div className="flex items-center gap-2 group/volume">
                                <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={volume}
                                  onChange={handleVolumeChange}
                                  className="w-0 group-hover/volume:w-24 transition-all opacity-0 group-hover/volume:opacity-100 cursor-pointer accent-white"
                                />
                              </div>

                              <span className="text-xs font-mono text-neutral-300">
                                {videoRef.current ? Math.floor(videoRef.current.currentTime / 60) : '0'}:
                                {videoRef.current ? String(Math.floor(videoRef.current.currentTime % 60)).padStart(2, '0') : '00'} 
                                {' / '} 
                                {video.duration}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <Settings className="w-5 h-5" />
                              </button>
                              <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <Maximize className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">{video.title}</h1>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/5 rounded-full hover:bg-neutral-800 transition-colors text-sm font-medium">
                <ThumbsUp className="w-4 h-4" /> Like
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/5 rounded-full hover:bg-neutral-800 transition-colors text-sm font-medium">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/5 rounded-full hover:bg-neutral-800 transition-colors text-sm font-medium">
                <Heart className="w-4 h-4" /> Save
              </button>
            </div>
          </div>

          <div className="p-4 bg-neutral-900 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-white">{video.views.toLocaleString()} views</span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-500">{formatDistanceToNow(video.createdAt)} ago</span>
              <span className="bg-rose-600/10 text-rose-500 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                {video.categoryId}
              </span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">
              {video.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {video.tags?.map(tag => (
                <span key={tag} className="text-[10px] bg-neutral-800 px-2 py-1 rounded-md text-neutral-400">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-neutral-400" />
            <h3 className="text-lg font-bold">Comments ({comments.length})</h3>
          </div>

          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex-shrink-0 overflow-hidden">
                {profile?.avatar ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-transparent border-b border-white/10 focus:border-rose-500 transition-colors py-2 text-sm focus:outline-none resize-none"
                  rows={1}
                />
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:hover:bg-rose-600 rounded-full text-sm font-bold transition-all"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-4 bg-neutral-900 border border-white/5 rounded-xl text-center">
              <p className="text-neutral-400 text-sm mb-4">Log in to join the conversation</p>
              <Link to="/login" className="px-6 py-2 bg-rose-600 rounded-full text-sm font-bold">Login</Link>
            </div>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex-shrink-0 overflow-hidden">
                  {comment.userAvatar ? <img src={comment.userAvatar} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{comment.userName}</span>
                    <span className="text-[10px] text-neutral-500">{formatDistanceToNow(comment.createdAt)} ago</span>
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar - Related Videos */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Play className="w-4 h-4 text-rose-600" />
          Related Videos
        </h3>
        <div className="flex flex-col gap-4">
          {relatedVideos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
          {relatedVideos.length === 0 && (
            <p className="text-neutral-500 text-sm italic">No related videos found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
