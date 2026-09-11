const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Short summary is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
    category: {
      type: String,
      default: 'Spine & Posture Care',
      enum: ['Spine & Posture Care', 'Cervical & Neck Relief', 'Knee & Joint Rehab', 'Sports Injury Recovery', 'Ergonomics & Wellness'],
    },
    author: {
      type: String,
      default: 'Dr. Gaurav Sharma (BPT, MPT Ortho)',
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    },
    videoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    readTime: {
      type: String,
      default: '4 min read',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: ['Physiotherapy', 'Rehab', 'Pain Relief'],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug before save
blogSchema.pre('save', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
