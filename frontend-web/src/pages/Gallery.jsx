import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  Image,
  Video,
  Calendar,
  MapPin,
  Play,
  X,
  ExternalLink,
  Sparkles,
  Compass,
  ArrowRight,
  Filter,
  Eye,
  Loader2
} from 'lucide-react';

export const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'photo', 'video', 'upcoming'
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Lightbox modal state
  const [activePhoto, setActivePhoto] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/gallery');
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      setError('Failed to load gallery items.');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories
  const categories = ['All', ...new Set(items.map((i) => i.category || 'General'))];

  // Filter items based on tab and category
  const filteredItems = items.filter((item) => {
    if (activeTab === 'photo' && item.mediaType !== 'photo') return false;
    if (activeTab === 'video' && item.mediaType !== 'video') return false;
    if (activeTab === 'upcoming' && !item.isUpcomingTourProgram) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    return true;
  });

  // Helper to format YouTube embed URLs if applicable
  const getEmbedVideoUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const vidId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vidId}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const vidId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vidId}?autoplay=1`;
    }
    return url;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
        <div className="relative space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Travel Memories & Sneak Peeks
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            WanderWise Gallery & Upcoming Programs
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Explore authentic tour photos, video reels, and discover upcoming travel itineraries,
            dates, and vehicle allocations designed for your next adventure.
          </p>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Main media tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          {[
            { id: 'all', label: 'All Items', icon: Compass },
            { id: 'photo', label: 'Photos', icon: Image },
            { id: 'video', label: 'Videos', icon: Video },
            { id: 'upcoming', label: 'Upcoming Programs', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 pl-1">
            <Filter className="w-3 h-3" />
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-sky-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading gallery collection...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold text-center">
          {error}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8">
          <Image className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No items in this category yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Check back soon or select a different filter above to view other tour photos, videos, and programs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isVideo = item.mediaType === 'video';
            const isUpcoming = item.isUpcomingTourProgram;
            const program = item.upcomingProgram;

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-200 group"
              >
                {/* Media Container */}
                <div
                  className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (isVideo) setActiveVideo(item);
                    else setActivePhoto(item);
                  }}
                >
                  <img
                    src={item.thumbnailUrl || item.mediaUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  {/* Overlays / Badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white border border-white/20">
                      {item.category || 'General'}
                    </span>

                    {isUpcoming && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md">
                        <Sparkles className="w-3 h-3" /> Upcoming Program
                      </span>
                    )}
                  </div>

                  {/* Video Play Button Overlay */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-sky-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white transition-all">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {!isVideo && (
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-2.5 py-1 rounded-lg bg-white/90 text-slate-800 text-[10px] font-bold flex items-center gap-1 shadow">
                        <Eye className="w-3 h-3" /> View Photo
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-sky-600 transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* If this is an Upcoming Tour Program, display details & Book CTA */}
                  {isUpcoming && program && (
                    <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-100 text-xs space-y-2.5">
                      <div className="flex items-center gap-1.5 text-sky-950 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Dates: {program.dates || 'Announced Soon'}</span>
                      </div>
                      {program.destination && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span>Destination: <strong>{program.destination}</strong></span>
                        </div>
                      )}
                      {program.itineraryBrief && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-2">
                          "{program.itineraryBrief}"
                        </p>
                      )}

                      {program.relatedTourId?._id ? (
                        <Link
                          to={`/book/${program.relatedTourId._id}`}
                          className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <span>Book This Upcoming Tour</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          to="/"
                          className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <span>Explore Available Tours</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[75vh] flex items-center justify-center bg-black">
              <img
                src={activePhoto.mediaUrl}
                alt={activePhoto.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>

            <div className="p-5 bg-slate-900 text-white space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                {activePhoto.category}
              </span>
              <h3 className="font-bold text-lg">{activePhoto.title}</h3>
              {activePhoto.description && (
                <p className="text-xs text-slate-300 leading-relaxed">{activePhoto.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {activeVideo.mediaUrl.includes('youtube.com') ||
              activeVideo.mediaUrl.includes('youtu.be') ? (
                <iframe
                  src={getEmbedVideoUrl(activeVideo.mediaUrl)}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeVideo.mediaUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="p-5 bg-slate-900 text-white space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                {activeVideo.category} • Video
              </span>
              <h3 className="font-bold text-lg">{activeVideo.title}</h3>
              {activeVideo.description && (
                <p className="text-xs text-slate-300 leading-relaxed">{activeVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
