export type UserRole = 'user' | 'moderator' | 'admin';

export interface SubMenuItem {
  label: string;
  link: string;
}

export interface MenuItem {
  id: string;
  label: string;
  link: string;
  subMenus?: SubMenuItem[];
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  categoryId: string;
  views: number;
  duration: string;
  createdAt: number;
  featured: boolean;
  locked: boolean;
  adClicks: number;
  published: boolean;
  tags: string[];
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: number;
}

export interface WatchHistory {
  id: string;
  userId: string;
  videoId: string;
  lastWatched: number;
  progress: number;
}

export interface Favorite {
  id: string;
  userId: string;
  videoId: string;
  createdAt: number;
}

export interface SiteSettings {
  siteName: string;
  logo?: string;
  primaryColor: string;
  footerText: string;
  contactEmail: string;
  socialLinks: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  navigationMenu?: MenuItem[];
  featureToggles: {
    lockedVideoScreen: boolean;
    darkMode: boolean;
  };
  adConfig: {
    enabled: boolean;
    directLink: string;
    socialBarScript: string;
    popunderScript: string;
    timerSeconds: number;
    popunderTopScript?: string;
    nativeBannerScript?: string;
    bannerScript?: string;
    smartlinkUrl?: string;
    socialBarTopScript?: string;
    showDirectLink?: boolean;
    showPromo1?: boolean;
    showPromo2?: boolean;
    showPromo3?: boolean;
    promoTitle1?: string;
    promoDesc1?: string;
    promoLink1?: string;
    promoIcon1?: string;
    promoTitle2?: string;
    promoDesc2?: string;
    promoLink2?: string;
    promoIcon2?: string;
    promoTitle3?: string;
    promoDesc3?: string;
    promoLink3?: string;
    promoIcon3?: string;
  };
}
