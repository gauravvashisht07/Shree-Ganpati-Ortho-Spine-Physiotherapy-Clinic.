import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Helper to convert standard YouTube/Vimeo links to embed format
function getEmbedUrl(url) {
  if (!url) return null;
  const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
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
  const embedUrl = post ? getEmbedUrl(post.videoUrl) : null;

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

        {/* Video Demonstration Player (if provided) */}
        {embedUrl && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-teal/20 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📹</span>
              <h3 className="text-lg font-display font-bold text-ink">Clinical Video Exercise Demonstration</h3>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner bg-black">
              <iframe
                src={embedUrl}
                title={post.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="text-xs text-gray-500 italic">
              Watch Dr. Gaurav Sharma demonstrate proper posture, isometric angles, and movement form.
            </p>
          </div>
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
