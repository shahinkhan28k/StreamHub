import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SiteSettings } from '../../types';
import { Settings as SettingsIcon, Globe, Palette, Shield, Share2, Save, Sparkles, Layout, Check, Megaphone, ExternalLink, Code, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm<SiteSettings>();
  const [success, setSuccess] = useState(false);

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
        const adConfigMerged = {
          enabled: savedData.adConfig?.enabled ?? false,
          directLink: savedData.adConfig?.directLink || defaultPromoConfig.directLink,
          socialBarScript: savedData.adConfig?.socialBarScript || '',
          popunderScript: savedData.adConfig?.popunderScript || '',
          timerSeconds: savedData.adConfig?.timerSeconds ?? defaultPromoConfig.timerSeconds,
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
        reset({
          siteName: 'StreamHub',
          primaryColor: '#e11d48',
          footerText: '© 2026 StreamHub. All rights reserved.',
          contactEmail: 'admin@streamhub.io',
          socialLinks: { twitter: '', facebook: '', instagram: '', youtube: '' },
          featureToggles: { lockedVideoScreen: true, darkMode: true },
          adConfig: {
            enabled: false,
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
    await setDoc(doc(db, 'settings', 'general'), data);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-neutral-400" /> Site Settings
        </h1>
        <p className="text-neutral-400 text-sm">Configure your platform appearance and core features</p>
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
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                  <ExternalLink className="w-3 h-3" /> Adsterra Direct Link
                </label>
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

            {/* Premium 3rd-Party App Promotions */}
            <div className="border-t border-white/5 pt-6 space-y-6">
              <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" /> Premium Third-Party App & CPI Offers
              </h3>
              <p className="text-xs text-neutral-500">Configure custom promotional cards (app installs, telegram channels, surveys) for the Video Ad-Gate offerwall.</p>
              
              <div className="grid grid-cols-1 gap-6 bg-neutral-950/40 p-6 rounded-2xl border border-white/5">
                {/* Campaign 1 */}
                <div className="space-y-4">
                  <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Sponsor Campaign #1 (e.g., Gaming/CPI App)</span>
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
                  <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Sponsor Campaign #2 (e.g., VPN/Utility Offer)</span>
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
                  <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Sponsor Campaign #3 (e.g., Telegram/Social Community)</span>
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
  );
}
