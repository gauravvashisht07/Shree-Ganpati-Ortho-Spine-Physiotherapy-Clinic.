import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Parses and categorizes video links: YouTube (standard, Shorts, youtu.be), Instagram (Reels, Posts, Profile), Vimeo, or MP4
function parseVideoSource(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. YouTube (standard watch?v=, short URL youtu.be, embed, or shorts)
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`,
      directUrl: trimmed.includes('youtube.com') || trimmed.includes('youtu.be') ? trimmed : `https://www.youtube.com/watch?v=${ytMatch[1]}`
    };
  }

  // 2. Instagram Reel or Post or IGTV (e.g. instagram.com/reel/CODE or instagram.com/p/CODE)
  const igPostMatch = trimmed.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/);
  if (igPostMatch) {
    const postCode = igPostMatch[1];
    return {
      type: 'instagram-post',
      embedUrl: `https://www.instagram.com/p/${postCode}/embed/`,
      directUrl: `https://www.instagram.com/p/${postCode}/`,
      postCode
    };
  }

  // 3. Instagram Profile / Handle (e.g. instagram.com/physiotherapist_nadaun)
  const igProfileMatch = trimmed.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
  if (igProfileMatch && !['p', 'reel', 'tv', 'stories', 'explore'].includes(igProfileMatch[1])) {
    const handle = igProfileMatch[1].replace(/[^a-zA-Z0-9_.]/g, '');
    return {
      type: 'instagram-profile',
      handle: handle,
      directUrl: trimmed
    };
  }

  // 4. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      directUrl: trimmed
    };
  }

  // 5. Direct MP4 / WebM
  if (trimmed.match(/\.(mp4|webm|ogg)($|\?)/i)) {
    return {
      type: 'direct-video',
      embedUrl: trimmed,
      directUrl: trimmed
    };
  }

  // Fallback: Generic Link
  return {
    type: 'generic-link',
    directUrl: trimmed
  };
}

function ClinicalVideoSection({ videoUrl, title }) {
  const video = parseVideoSource(videoUrl);
  if (!video) return null;

  // Case 1: YouTube (Standard & Shorts)
  if (video.type === 'youtube') {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-red-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              ▶
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-display font-bold text-ink">Clinical Video Exercise Demonstration</h3>
              <p className="text-xs text-gray-500">YouTube Clinical Guide by Dr. Gaurav Sharma</p>
            </div>
          </div>
          <a
            href={video.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>Watch on YouTube</span>
            <span>↗</span>
          </a>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner bg-black">
          <iframe
            src={video.embedUrl}
            title={title || 'Clinical Video Exercise Demonstration'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <p className="text-xs text-gray-500 italic">
          Watch Dr. Gaurav Sharma demonstrate proper posture, isometric angles, and movement form.
        </p>
      </div>
    );
  }

  // Case 2: Instagram Reel or Post
  if (video.type === 'instagram-post') {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-pink-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center text-base shadow-xs">
              📸
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-display font-bold text-ink">Clinical Video Demonstration</h3>
              <p className="text-xs text-gray-500">Instagram Reel Guide (@physiotherapist_nadaun_)</p>
            </div>
          </div>
          <a
            href={video.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-pink-700 hover:text-white bg-pink-50 hover:bg-gradient-to-r hover:from-[#833ab4] hover:to-[#fd1d1d] px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>Open in Instagram</span>
            <span>↗</span>
          </a>
        </div>

        <div className="flex justify-center bg-gradient-to-b from-gray-50 to-white rounded-2xl p-2 sm:p-4 border border-gray-100">
          <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-200">
            <iframe
              src={video.embedUrl}
              title={title || 'Instagram Clinical Video'}
              className="w-full h-[540px] border-0"
              scrolling="no"
              allowTransparency="true"
              allow="encrypted-media"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span>Demonstrated by Dr. Gaurav Sharma (BPT, MPT Ortho)</span>
          <a
            href={video.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-coral hover:underline flex items-center gap-1"
          >
            Watch original Reel on Instagram ↗
          </a>
        </div>
      </div>
    );
  }

  // Case 3: Instagram Profile Link (e.g. instagram.com/physiotherapist_nadaun)
  if (video.type === 'instagram-profile') {
    return (
      <div className="bg-gradient-to-br from-[#833ab4]/10 via-[#fd1d1d]/10 to-[#fcb045]/15 p-6 sm:p-8 rounded-3xl border-2 border-pink-200/70 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              📸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-bold text-ink">Clinical Video Demonstration</h3>
                <span className="text-[10px] font-black uppercase bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">
                  Instagram
                </span>
              </div>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                @{video.handle || 'physiotherapist_nadaun_'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Watch Dr. Gaurav Sharma demonstrate this exercise routine, isometric angles, and rehabilitation form.
              </p>
            </div>
          </div>

          <a
            href={video.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-bold px-6 py-3.5 rounded-full hover:opacity-95 transition-all shadow-md text-sm flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center"
          >
            <span>▶ Watch Video on Instagram</span>
            <span>↗</span>
          </a>
        </div>

        <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-pink-100 text-xs text-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            📹 Follow our official Instagram page for daily rehabilitation reels, posture correction tutorials, and spine care guides.
          </span>
          <a
            href={video.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 font-bold hover:underline shrink-0"
          >
            Open Instagram Profile ↗
          </a>
        </div>
      </div>
    );
  }

  // Case 4: Direct MP4 / WebM
  if (video.type === 'direct-video') {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-teal/20 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📹</span>
          <h3 className="text-lg font-display font-bold text-ink">Clinical Video Exercise Demonstration</h3>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner bg-black">
          <video
            controls
            src={video.embedUrl}
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-xs text-gray-500 italic">
          Watch Dr. Gaurav Sharma demonstrate proper posture, isometric angles, and movement form.
        </p>
      </div>
    );
  }

  // Case 5: Vimeo
  if (video.type === 'vimeo') {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-teal/20 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📹</span>
          <h3 className="text-lg font-display font-bold text-ink">Clinical Video Exercise Demonstration</h3>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner bg-black">
          <iframe
            src={video.embedUrl}
            title={title || 'Vimeo Clinical Video'}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Case 6: Generic Link
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-teal/20 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📹</span>
        <div>
          <h3 className="font-bold text-ink text-base">Clinical Video Demonstration</h3>
          <p className="text-xs text-gray-500">Watch the exercise demonstration video for this guide.</p>
        </div>
      </div>
      <a
        href={video.directUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-coral text-white font-bold px-5 py-2.5 rounded-full text-xs hover:bg-[#E55A39] transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
      >
        <span>Watch Video</span>
        <span>↗</span>
      </a>
    </div>
  );
}

export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-detail', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/blogs/${id}`);
      return data;
    }
  });

  const { data: allBlogs = [] } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/blogs');
      return data;
    }
  });

  const relatedPosts = allBlogs.filter(b => b._id !== post?._id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex flex-col justify-between">
        <Navbar />
        <div className="max-w-4xl mx-auto py-20 px-6 w-full space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4"></div>
          <div className="h-96 bg-gray-200 rounded-3xl"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-base flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto py-24 px-6 text-center space-y-4">
          <h2 className="text-3xl font-display font-black text-ink">Article Not Found</h2>
          <p className="text-gray-500 text-sm">The physiotherapy article or video guide you requested does not exist.</p>
          <button
            onClick={() => navigate('/blog')}
            className="bg-teal text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-ink transition-colors"
          >
            ← Back to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex flex-col justify-between font-body text-ink">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto w-full space-y-10">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Link to="/" className="hover:text-coral transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-coral transition-colors">Blog &amp; Insights</Link>
          <span>/</span>
          <span className="text-teal truncate max-w-xs">{post.title}</span>
        </div>

        {/* Article Header */}
        <div className="space-y-4 text-center md:text-left">
          <span className="text-xs font-bold text-teal bg-teal/10 px-4 py-1.5 rounded-full inline-block">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-ink leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-gray-500">
            <span className="font-bold text-ink">By {post.author}</span>
            <span>•</span>
            <span>Published on {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>⏱ {post.readTime}</span>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100 max-h-[480px]">
          <img
            src={post.coverImage || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80'}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Video Demonstration Player (Instagram Reel/Post/Profile, YouTube, Shorts, Vimeo, MP4) */}
        {post.videoUrl && (
          <ClinicalVideoSection videoUrl={post.videoUrl} title={post.title} />
        )}

        {/* Full Article Content */}
        <article className="bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-6 text-gray-700 leading-relaxed text-base sm:text-lg whitespace-pre-line">
          {post.content}
        </article>

        {/* Doctor Consultation CTA Card */}
        <div className="bg-[#FAF6F0] p-8 rounded-3xl border-2 border-teal/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-display font-black text-ink">Need Professional Physiotherapy?</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Consult Dr. Gaurav Sharma at Shree Ganpati Ortho &amp; Spine Clinic in Nadaun for customized rehabilitation.
            </p>
          </div>
          <Link
            to="/book"
            className="bg-coral text-white font-bold px-8 py-4 rounded-full hover:bg-[#E55A39] transition-all shadow-md text-base flex-shrink-0"
          >
            Book Session with Doctor →
          </Link>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="pt-8 space-y-6 border-t border-gray-200">
            <h2 className="text-2xl font-display font-bold text-ink">More Health Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(rel => (
                <div key={rel._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-ink text-sm leading-snug mb-2">
                    <Link to={`/blog/${rel.slug || rel._id}`} className="hover:text-teal transition-colors">
                      {rel.title}
                    </Link>
                  </h4>
                  <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto">
                    <span>{rel.category}</span>
                    <Link to={`/blog/${rel.slug || rel._id}`} className="text-coral font-bold hover:underline">
                      Read →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
