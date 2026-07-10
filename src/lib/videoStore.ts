import { collection, getDocs, doc, setDoc, deleteDoc, query, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Video } from '../types';

const LOCAL_VIDEOS_KEY = 'novastream_local_videos';

const DEFAULT_SEED_VIDEOS: Video[] = [
  {
    id: 'seed-cyberpunk',
    title: "Neon City - Cyberpunk Atmosphere",
    description: "Explore the neon-lit streets of a futuristic city in this immersive cinematic experience. High definition visuals and ambient soundtrack.",
    thumbnail: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&auto=format&fit=crop&q=60",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    categoryId: "movies",
    views: 125400,
    adClicks: 420,
    duration: "09:56",
    createdAt: Date.now() - 86400000 * 2,
    featured: true,
    locked: false,
    published: true,
    tags: ["cyberpunk", "cinematic", "scifi"]
  },
  {
    id: 'seed-nature',
    title: "Great Mountain Peaks - 4K Drone Footage",
    description: "Breathtaking views of the world's most beautiful mountain ranges. Shot in 4K resolution with professional drone equipment.",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=60",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    categoryId: "tech",
    views: 89000,
    adClicks: 310,
    duration: "10:53",
    createdAt: Date.now() - 86400000 * 5,
    featured: false,
    locked: true,
    published: true,
    tags: ["nature", "drone", "4k"]
  },
  {
    id: 'seed-urban',
    title: "Urban Exploring - Abandoned Factory",
    description: "Join us as we explore a massive abandoned factory from the 1920s. Discover hidden artifacts and historical secrets.",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=60",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    categoryId: "gaming",
    views: 45000,
    adClicks: 112,
    duration: "00:15",
    createdAt: Date.now() - 86400000,
    featured: false,
    locked: false,
    published: true,
    tags: ["exploration", "urban", "history"]
  },
  {
    id: 'seed-masterclass',
    title: "Premium Masterclass: Advanced Video Production",
    description: "Unlock professional techniques for high-end video editing and color grading. Available for premium members only.",
    thumbnail: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=60",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    categoryId: "tech",
    views: 1200,
    adClicks: 95,
    duration: "15:20",
    createdAt: Date.now() - 3600000 * 12,
    featured: false,
    locked: true,
    published: true,
    tags: ["education", "pro", "video"]
  }
];

// Helper to get local videos from storage
function getLocalOnlyVideos(): Video[] {
  const localData = localStorage.getItem(LOCAL_VIDEOS_KEY);
  if (!localData) {
    localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(DEFAULT_SEED_VIDEOS));
    return DEFAULT_SEED_VIDEOS;
  }
  try {
    return JSON.parse(localData);
  } catch (e) {
    return DEFAULT_SEED_VIDEOS;
  }
}

// Get all videos with fail-safe fallback
export async function getStoredVideos(): Promise<Video[]> {
  try {
    const videosRef = collection(db, 'videos');
    const snapshot = await getDocs(query(videosRef));
    if (!snapshot.empty) {
      const firebaseVideos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
      // Save a local copy for offline use/fallback
      localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(firebaseVideos));
      return firebaseVideos;
    }
  } catch (error) {
    console.warn("Firestore unavailable, falling back to local database:", error);
  }
  return getLocalOnlyVideos();
}

// Get single video
export async function getSingleStoredVideo(id: string): Promise<Video | null> {
  try {
    const docRef = doc(db, 'videos', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Video;
    }
  } catch (error) {
    console.warn(`Firestore get error for ID ${id}, searching local copy:`, error);
  }
  const locals = getLocalOnlyVideos();
  return locals.find(v => v.id === id) || null;
}

// Save/add/update video
export async function saveStoredVideo(videoData: Partial<Video> & { id?: string }): Promise<Video> {
  const locals = getLocalOnlyVideos();
  const isNew = !videoData.id;
  const id = videoData.id || `video-${Date.now()}`;
  
  const finalVideo: Video = {
    id,
    title: videoData.title || 'Untitled Video',
    description: videoData.description || '',
    thumbnail: videoData.thumbnail || 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800',
    videoUrl: videoData.videoUrl || '',
    categoryId: videoData.categoryId || 'movies',
    views: videoData.views || 0,
    adClicks: videoData.adClicks || 0,
    duration: videoData.duration || '00:00',
    createdAt: videoData.createdAt || Date.now(),
    featured: !!videoData.featured,
    locked: !!videoData.locked,
    published: videoData.published !== undefined ? !!videoData.published : true,
    tags: videoData.tags || []
  };

  // Update local storage
  let updatedLocals: Video[];
  if (isNew) {
    updatedLocals = [finalVideo, ...locals];
  } else {
    updatedLocals = locals.map(v => v.id === id ? finalVideo : v);
  }
  localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(updatedLocals));

  // Try updating Firestore in background
  try {
    const docRef = doc(db, 'videos', id);
    await setDoc(docRef, finalVideo, { merge: true });
    console.log("Firestore successfully synchronized.");
  } catch (error) {
    console.warn("Firestore write skipped, stored in local storage:", error);
  }

  return finalVideo;
}

// Delete video
export async function deleteStoredVideo(video: Video): Promise<void> {
  // Update local storage
  const locals = getLocalOnlyVideos();
  const updatedLocals = locals.filter(v => v.id !== video.id);
  localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(updatedLocals));

  // Try updating Firestore
  try {
    await deleteDoc(doc(db, 'videos', video.id));
    console.log("Deleted from Firestore.");
  } catch (error) {
    console.warn("Firestore delete skipped, removed from local storage:", error);
  }
}
