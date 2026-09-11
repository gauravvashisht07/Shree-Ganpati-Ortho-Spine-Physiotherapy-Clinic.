import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CATEGORIES = [
  'All',
  'Spine & Posture Care',
  'Cervical & Neck Relief',
  'Knee & Joint Rehab',
  'Sports Injury Recovery',
  'Ergonomics & Wellness'
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['blogs', selectedCategory, searchQuery],
    queryFn: async () => {
      let url = '/blogs?';
      if (selectedCategory !== 'All') url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      const { data } = await axiosInstance.get(url);
      return data;
    }
  });

  const featuredPost = blogs.find(b => b.isFeatured) || blogs[0];
  const regularPosts = blogs.filter(b => b._id !== featuredPost?._id);

  return (
    <div className="min-h-screen bg-base flex flex-col justify-between font-body text-ink">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-4 py-1.5 rounded-full inline-block">
            Physiotherapy Insights &amp; Video Guides
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-black text-ink">
            Clinical Wisdom &amp; <span className="text-teal">Recovery Tips</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Doctor-approved exercise demonstrations, spine health insights, posture correction guides, and patient recovery stories from Shree Ganpati Clinic.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search exercises, cervical, sciatica, knee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 py-3.5 pl-12 pr-4 rounded-full text-sm font-bold text-ink focus:outline-none focus:border-teal shadow-xs"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 justify-start sm:justify-center scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-ink text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-96 bg-white/70 animate-pulse rounded-3xl border border-gray-100"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-white/70 animate-pulse rounded-3xl border border-gray-100"></div>
              ))}
            </div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 max-w-xl mx-auto">
            <p className="text-5xl mb-4">📖</p>
            <h3 className="text-2xl font-bold font-display text-ink mb-2">No articles found</h3>
            <p className="text-gray-500 text-sm mb-6">
              Try adjusting your category filter or search keywords to find clinical guides.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="bg-teal text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-ink transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Featured Hero Article */}
            {featuredPost && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-12 group hover:shadow-md transition-shadow">
                <div className="lg:col-span-7 relative h-72 lg:h-auto overflow-hidden bg-gray-100">
                  <img
                    src={featuredPost.coverImage || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {featuredPost.videoUrl && (
                    <span className="absolute top-4 left-4 bg-coral text-white text-xs font-black uppercase px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                      <span>▶</span> Video Demonstration
                    </span>
                  )}
                  <span className="absolute bottom-4 left-4 bg-ink/80 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs">
                    ⭐ Featured Insight
                  </span>
                </div>

                <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-teal bg-teal/10 px-3 py-1 rounded-full inline-block">
                      {featuredPost.category}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-ink group-hover:text-coral transition-colors leading-tight">
                      <Link to={`/blog/${featuredPost.slug || featuredPost._id}`}>
                        {featuredPost.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm">
                        GS
                      </div>
                      <div>
                        <p className="font-bold text-ink text-xs truncate">{featuredPost.author}</p>
                        <p className="text-[11px] text-gray-400">{featuredPost.readTime} • {new Date(featuredPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    <Link
                      to={`/blog/${featuredPost.slug || featuredPost._id}`}
                      className="text-xs font-bold bg-coral text-white hover:bg-[#E55A39] px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
                    >
                      Read Article →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Post Grid */}
            {regularPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post) => (
                  <article
                    key={post._id}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow group"
                  >
                    <div className="relative h-52 overflow-hidden bg-gray-100">
                      <img
                        src={post.coverImage || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {post.videoUrl && (
                        <span className="absolute top-3 right-3 bg-black/70 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                          <span>▶</span> Video
                        </span>
                      )}
                      <span className="absolute bottom-3 left-3 bg-white/95 text-teal text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-display font-bold text-ink text-lg group-hover:text-teal transition-colors leading-snug mb-2">
                          <Link to={`/blog/${post.slug || post._id}`}>
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 mt-auto">
                        <span>{post.readTime}</span>
                        <Link
                          to={`/blog/${post.slug || post._id}`}
                          className="font-bold text-coral hover:underline flex items-center gap-1"
                        >
                          Read Guide →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
