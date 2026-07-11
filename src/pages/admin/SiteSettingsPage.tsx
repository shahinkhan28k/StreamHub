import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SiteSettings, MenuItem, SubMenuItem } from '../../types';
import { 
  Settings as SettingsIcon, Globe, Palette, Shield, Share2, Save, 
  Sparkles, Layout, Check, Megaphone, ExternalLink, Code, Clock,
  Plus, Trash2, ArrowLeft, Menu, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

export default function SiteSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm<SiteSettings>();
  const [success, setSuccess] = useState(false);

  // Navigation Menu Management State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuLink, setNewMenuLink] = useState('');
  const [newSubMenuLabel, setNewSubMenuLabel] = useState<{[key: string]: string}>({});
  const [newSubMenuLink, setNewSubMenuLink] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const defaultPromoConfig = {
        directLink: 'https://example.com/adsterra-direct',
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

      const docSnap = await getDoc(doc(db, 'settings', 'general'));
      if (docSnap.exists()) {
        const savedData = docSnap.data() as SiteSettings;
        setMenuItems(savedData.navigationMenu || [
          { id: '1', label: 'Home', link: '/' },
          { id: '2', label: 'Movies', link: '/category/movies' },
          { id: '3', label: 'Sports', link: '/category/sports' },
          { id: '4', label: 'Gaming', link: '/category/gaming' }
        ]);

        const adConfigMerged = {
          enabled: savedData.adConfig?.enabled ?? false,
          directLink: savedData.adConfig?.directLink || defaultPromoConfig.directLink,
          socialBarScript: savedData.adConfig?.socialBarScript || '',
          popunderScript: savedData.adConfig?.popunderScript || '',
          popunderTopScript: savedData.adConfig?.popunderTopScript || '',
          nativeBannerScript: savedData.adConfig?.nativeBannerScript || '',
          bannerScript: savedData.adConfig?.bannerScript || '',
          smartlinkUrl: savedData.adConfig?.smartlinkUrl || '',
          socialBarTopScript: savedData.adConfig?.socialBarTopScript || '',
          timerSeconds: savedData.adConfig?.timerSeconds ?? defaultPromoConfig.timerSeconds,
          showDirectLink: savedData.adConfig?.showDirectLink !== false,
          showPromo1: savedData.adConfig?.showPromo1 !== false,
          showPromo2: savedData.adConfig?.showPromo2 !== false,
          showPromo3: savedData.adConfig?.showPromo3 !== false,
          promoTitle1: savedData.adConfig?.promoTitle1 || defaultPromoConfig.promoTitle1,
          promoDesc1: savedData.adConfig?.promoDesc1 || defaultPromoConfig.promoDesc1,
          promoLink1: savedData.adConfig?.promoLink1 || defaultPromoConfig.promoLink1,
          promoIcon1: savedData.adConfig?.promoIcon1 || defaultPromoConfig.promoIcon1,
          promoTitle2: savedData.adConfig?.promoTitle2 || defaultPromoConfig.promoTitle2,
          promoDesc2: savedData.adConfig?.promoDesc2 || defaultPromoConfig.promoDesc2,
          promoLink2: savedData.adConfig?.promoLink2 || defaultPromoConfig.promoLink2,
          promoIcon2: savedData.adConfig?.promoIcon2 || defaultPromoConfig.promoIcon2,
          promoTitle3: savedData.adConfig?.promoTitle3 || defaultPromoConfig.promoTitle3,
          promoDesc3: savedData.adConfig?.promoDesc3 || defaultPromoConfig.promoDesc3,
          promoLink3: savedData.adConfig?.promoLink3 || defaultPromoConfig.promoLink3,
          promoIcon3: savedData.adConfig?.promoIcon3 || defaultPromoConfig.promoIcon3
        };
        reset({
          ...savedData,
          adConfig: adConfigMerged
        });
      } else {
        // Defaults
        const defaultMenu = [
          { id: '1', label: 'Home', link: '/' },
          { id: '2', label: 'Movies', link: '/category/movies' },
          { id: '3', label: 'Sports', link: '/category/sports' },
          { id: '4', label: 'Gaming', link: '/category/gaming' }
        ];
        setMenuItems(defaultMenu);
        reset({
          siteName: 'StreamHub',
          primaryColor: '#e11d48',
          footerText: '© 2026 StreamHub. All rights reserved.',
          contactEmail: 'admin@streamhub.io',
          socialLinks: { twitter: '', facebook: '', instagram: '', youtube: '' },
          featureToggles: { lockedVideoScreen: true, darkMode: true },
          adConfig: {
            enabled: false,
            showDirectLink: true,
            showPromo1: true,
            showPromo2: true,
            showPromo3: true,
            popunderTopScript: '',
            nativeBannerScript: '',
            bannerScript: '',
            smartlinkUrl: '',
            socialBarTopScript: '',
            ...defaultPromoConfig
          }
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: SiteSettings) => {
    setLoading(true);
    const updatedData = {
      ...data,
      navigationMenu: menuItems
    };
    await setDoc(doc(db, 'settings', 'general'), updatedData);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const addMenuItem = () => {
    if (!newMenuLabel.trim()) return;
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: newMenuLabel.trim(),
      link: newMenuLink.trim() || '#',
      subMenus: []
    };
    setMenuItems([...menuItems, newItem]);
    setNewMenuLabel('');
    setNewMenuLink('');
  };

  const removeMenuItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const addSubMenuItem = (menuId: string) => {
    const label = newSubMenuLabel[menuId]?.trim();
    const link = newSubMenuLink[menuId]?.trim();
    if (!label) return;

    setMenuItems(menuItems.map(item => {
      if (item.id === menuId) {
        return {
          ...item,
          subMenus: [...(item.subMenus || []), { label, link: link || '#' }]
        };
      }
      return item;
    }));

    setNewSubMenuLabel({ ...newSubMenuLabel, [menuId]: '' });
    setNewSubMenuLink({ ...newSubMenuLink, [menuId]: '' });
  };

  const removeSubMenuItem = (menuId: string, index: number) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === menuId) {
        const updated = [...(item.subMenus || [])];
        updated.splice(index, 1);
        return {
          ...item,
          subMenus: updated
        };
      }
      return item;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Elegant Sidebar */}
        <AdminSidebar />

        {/* Settings Content Area */}
        <div className="flex-1 w-full space-y-6">
          {/* Back Button */}
          <div className="flex items-center">
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-full text-xs font-bold text-neutral-300 hover:text-white transition-all shadow-xl"
            >
              <ChevronLeft className="w-4 h-4 text-rose-500" />
              <span>ফিরে যান (Go Back)</span>
            </button>
          </div>

          <div className="bg-neutral-900/40 p-6 rounded-3xl border border-white/5">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-rose-600 animate-pulse" /> Site Settings
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Configure your platform appearance, monetization triggers, and header categories</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* General Info */}
        <section className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold">General Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Website Name</label>
              <input {...register('siteName')} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Contact Email</label>
              <input {...register('contactEmail')} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Footer Copyright Text</label>
              <input {...register('footerText')} className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors" />
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Palette className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold">Branding & Theme</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Primary Accent Color</label>
              <div className="flex gap-4">
                <input type="color" {...register('primaryColor')} className="w-12 h-12 bg-neutral-800 border border-white/5 rounded-xl overflow-hidden cursor-pointer p-1" />
                <input {...register('primaryColor')} className="flex-1 bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Theme Mode</label>
              <div className="flex items-center gap-4 p-3 bg-neutral-800 rounded-xl border border-white/5">
                 <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" {...register('featureToggles.darkMode')} className="peer sr-only" />
                    <div className="w-10 h-6 bg-neutral-700 rounded-full transition-colors peer-checked:bg-rose-600" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm font-medium">Force Dark Mode</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Navigation Menu Settings */}
        <section className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Menu className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold">Dynamic Navigation Menus</h2>
              <p className="text-xs text-neutral-500">Edit website categories, create nested submenus, and configure links dynamically</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* List of current top-level navigation items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-neutral-950/60 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5" /> {item.label}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => removeMenuItem(item.id)} 
                      className="p-1 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">Label</span>
                      <p className="font-semibold text-white mt-0.5">{item.label}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">Path / URL</span>
                      <p className="font-mono mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-rose-400">{item.link}</p>
                    </div>
                  </div>

                  {/* Submenus inside this item */}
                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Submenus ({item.subMenus?.length || 0})</span>
                    <div className="space-y-1.5">
                      {item.subMenus?.map((sub, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between bg-neutral-900/50 py-1.5 px-3 rounded-lg border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{sub.label}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">{sub.link}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeSubMenuItem(item.id, sIdx)}
                            className="p-1 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Form to add sub-menu item */}
                    <div className="flex gap-2 items-center bg-neutral-900 p-2 rounded-xl border border-white/5 mt-3">
                      <input 
                        type="text" 
                        placeholder="Sub Label" 
                        value={newSubMenuLabel[item.id] || ''}
                        onChange={(e) => setNewSubMenuLabel({ ...newSubMenuLabel, [item.id]: e.target.value })}
                        className="bg-neutral-950 border border-white/5 rounded-lg py-1 px-2 text-xs w-full focus:outline-none focus:border-rose-500 text-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Sub Link" 
                        value={newSubMenuLink[item.id] || ''}
                        onChange={(e) => setNewSubMenuLink({ ...newSubMenuLink, [item.id]: e.target.value })}
                        className="bg-neutral-950 border border-white/5 rounded-lg py-1 px-2 text-xs w-full focus:outline-none focus:border-rose-500 text-white font-mono"
                      />
                      <button 
                        type="button" 
                        onClick={() => addSubMenuItem(item.id)}
                        className="p-1 bg-rose-600 hover:bg-rose-700 rounded-lg text-white font-bold transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form to add top-level navigation item */}
            <div className="bg-neutral-950/40 p-5 rounded-2xl border border-white/5 space-y-4">
              <span className="text-xs font-black text-neutral-300 uppercase tracking-widest block">Create New Main Category Tab</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tab Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Premium Sports" 
                    value={newMenuLabel}
                    onChange={(e) => setNewMenuLabel(e.target.value)}
                    className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-rose-500 text-white" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tab Link (e.g., /category/sports or external URL)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., /category/sports" 
                    value={newMenuLink}
                    onChange={(e) => setNewMenuLink(e.target.value)}
                    className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-rose-500 text-white font-mono" 
                  />
                </div>
              </div>
              <button 
                type="button" 
                onClick={addMenuItem}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-4 h-4 text-rose-500" /> Confirm & Append Category
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold">Feature Toggles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 bg-neutral-800 rounded-2xl border border-white/5 cursor-pointer hover:bg-neutral-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-900 rounded-lg"><Layout className="w-4 h-4 text-amber-500" /></div>
                <span className="text-sm font-semibold">Locked Video Access Flow</span>
              </div>
              <div className="relative">
                <input type="checkbox" {...register('featureToggles.lockedVideoScreen')} className="peer sr-only" />
                <div className="w-10 h-6 bg-neutral-900 rounded-full transition-colors peer-checked:bg-amber-500" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          </div>
        </section>

        {/* Advertisement & Adsterra */}
        <section className="bg-neutral-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Megaphone className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold">Advertisement (Adsterra)</h2>
          </div>

          <div className="space-y-6">
            <label className="flex items-center justify-between p-4 bg-neutral-800 rounded-2xl border border-white/5 cursor-pointer hover:bg-neutral-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-900 rounded-lg"><Sparkles className="w-4 h-4 text-emerald-500" /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Enable Global Ad-Gate</span>
                  <span className="text-xs text-neutral-500">Requires users to click ads before playing locked videos</span>
                </div>
              </div>
              <div className="relative">
                <input type="checkbox" {...register('adConfig.enabled')} className="peer sr-only" />
                <div className="w-10 h-6 bg-neutral-900 rounded-full transition-colors peer-checked:bg-emerald-500" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
              </div>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <ExternalLink className="w-3 h-3" /> Adsterra Direct Link
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" {...register('adConfig.showDirectLink')} className="peer sr-only" />
                      <div className="w-8 h-5 bg-neutral-800 rounded-full transition-colors peer-checked:bg-emerald-500" />
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-3" />
                    </div>
                    <span className="text-[11px] text-neutral-400 font-semibold">সক্রিয় (Active)</span>
                  </label>
                </div>
                <input 
                  {...register('adConfig.directLink')} 
                  placeholder="https://example.com/direct-link"
                  className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Ad-Gate Timer (Seconds)
                </label>
                <input 
                  type="number"
                  {...register('adConfig.timerSeconds')} 
                  className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Code className="w-3 h-3" /> Social Bar Script
              </label>
              <textarea 
                {...register('adConfig.socialBarScript')} 
                rows={3}
                placeholder="Paste script here..."
                className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors font-mono text-xs" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                <Code className="w-3 h-3" /> Popunder Script
              </label>
              <textarea 
                {...register('adConfig.popunderScript')} 
                rows={3}
                placeholder="Paste script here..."
                className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors font-mono text-xs" 
              />
            </div>

            {/* Custom Placements requested by the user */}
            <div className="border-t border-white/5 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-rose-500" /> কাস্টম বিজ্ঞাপন প্লেসমেন্ট (Custom Ad Placements)
              </h3>
              <p className="text-xs text-neutral-500">
                এই প্লেসমেন্টগুলোর স্ক্রিপ্ট বা লিংক সরাসরি ওয়েবসাইটের সংশ্লিষ্ট স্থানে রেন্ডার করা হবে। (These scripts/links will render dynamically inside the designated slots on the platform.)
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-3 h-3 text-rose-500" /> PopunderTOP (পপআন্ডার টপ স্ক্রিপ্ট)
                  </label>
                  <textarea 
                    {...register('adConfig.popunderTopScript')} 
                    rows={3}
                    placeholder="পপআন্ডার টপ স্ক্রিপ্ট বা লিংক এখানে দিন..."
                    className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors font-mono text-xs" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-3 h-3 text-rose-500" /> Social BarTOP (সোশ্যাল বার টপ স্ক্রিপ্ট)
                  </label>
                  <textarea 
                    {...register('adConfig.socialBarTopScript')} 
                    rows={3}
                    placeholder="টপ সোশ্যাল বার স্ক্রিপ্ট এখানে দিন..."
                    className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors font-mono text-xs" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-3 h-3 text-rose-500" /> Native Banner (নেটিভ ব্যানার স্ক্রিপ্ট)
                  </label>
                  <textarea 
                    {...register('adConfig.nativeBannerScript')} 
                    rows={3}
                    placeholder="নেটিভ ব্যানার কোড/আইফ্রেম বা স্ক্রিপ্ট এখানে দিন..."
                    className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors font-mono text-xs" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-3 h-3 text-rose-500" /> Banner (ব্যানার বিজ্ঞাপন স্ক্রিপ্ট)
                  </label>
                  <textarea 
                    {...register('adConfig.bannerScript')} 
                    rows={3}
                    placeholder="ব্যানার কোড/আইফ্রেম বা স্ক্রিপ্ট এখানে দিন..."
                    className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors font-mono text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <ExternalLink className="w-3 h-3 text-rose-500" /> Smartlink (স্মার্টলিঙ্ক URL)
                </label>
                <input 
                  {...register('adConfig.smartlinkUrl')} 
                  placeholder="https://example.com/smartlink"
                  className="w-full bg-neutral-800 border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-rose-500 transition-colors font-mono text-xs" 
                />
              </div>
            </div>

            {/* Premium 3rd-Party App Promotions */}
            <div className="border-t border-white/5 pt-6 space-y-6">
              <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" /> Premium Third-Party App & CPI Offers
              </h3>
              <p className="text-xs text-neutral-500">Configure custom promotional cards (app installs, telegram channels, surveys) for the Video Ad-Gate offerwall.</p>
              
              <div className="grid grid-cols-1 gap-6 bg-neutral-950/40 p-6 rounded-2xl border border-white/5">
                {/* Campaign 1 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Sponsor Campaign #1 (e.g., Gaming/CPI App)</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" {...register('adConfig.showPromo1')} className="peer sr-only" />
                        <div className="w-8 h-5 bg-neutral-800 rounded-full transition-colors peer-checked:bg-emerald-500" />
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-3" />
                      </div>
                      <span className="text-[11px] text-neutral-400 font-semibold">সক্রিয় (Active)</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Title</label>
                      <input {...register('adConfig.promoTitle1')} placeholder="Free Fire Arena" className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Promo Link (CPA/CPI/Direct Link)</label>
                      <input {...register('adConfig.promoLink1')} placeholder="https://..." className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Short Description / Instructions</label>
                      <input {...register('adConfig.promoDesc1')} placeholder="Install and play for 30s to unlock video instantly!" className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                  </div>
                </div>

                {/* Campaign 2 */}
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Sponsor Campaign #2 (e.g., VPN/Utility Offer)</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" {...register('adConfig.showPromo2')} className="peer sr-only" />
                        <div className="w-8 h-5 bg-neutral-800 rounded-full transition-colors peer-checked:bg-emerald-500" />
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-3" />
                      </div>
                      <span className="text-[11px] text-neutral-400 font-semibold">সক্রিয় (Active)</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Title</label>
                      <input {...register('adConfig.promoTitle2')} placeholder="Super VPN Premium" className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Promo Link (CPA/CPI/Direct Link)</label>
                      <input {...register('adConfig.promoLink2')} placeholder="https://..." className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Short Description / Instructions</label>
                      <input {...register('adConfig.promoDesc2')} placeholder="Secure your browsing with zero log VPN. Fast & Free!" className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                  </div>
                </div>

                {/* Campaign 3 */}
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Sponsor Campaign #3 (e.g., Telegram/Social Community)</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" {...register('adConfig.showPromo3')} className="peer sr-only" />
                        <div className="w-8 h-5 bg-neutral-800 rounded-full transition-colors peer-checked:bg-emerald-500" />
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-3" />
                      </div>
                      <span className="text-[11px] text-neutral-400 font-semibold">সক্রিয় (Active)</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Title</label>
                      <input {...register('adConfig.promoTitle3')} placeholder="Join Movie Channel" className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Promo Link (Telegram Channel URL)</label>
                      <input {...register('adConfig.promoLink3')} placeholder="https://t.me/..." className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase">Short Description / Instructions</label>
                      <input {...register('adConfig.promoDesc3')} placeholder="Subscribe to our Official Telegram for premium daily updates!" className="w-full bg-neutral-800 border border-white/5 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-rose-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sticky bottom-8 flex justify-center">
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-12 py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-full font-bold transition-all shadow-2xl shadow-rose-600/30 scale-105"
          >
            {success ? <><Check className="w-5 h-5" /> Settings Saved</> : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
}
