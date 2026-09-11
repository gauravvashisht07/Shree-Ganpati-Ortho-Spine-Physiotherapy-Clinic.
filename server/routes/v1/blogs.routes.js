const express = require('express');
const router = express.Router();
const Blog = require('../../models/Blog');
const authMiddleware = require('../../middleware/auth.middleware');

// Initial seed blogs if none exist
const SEED_BLOGS = [
  {
    title: '5 Effective Exercises for Cervical Spondylosis & Neck Stiffness',
    slug: 'exercises-for-cervical-spondylosis-neck-stiffness',
    excerpt: 'Learn targeted physiotherapeutic neck stretches and isometric contractions to relieve radiating arm numbness, headaches, and desk-related cervical tension.',
    content: `Cervical spondylosis is one of the most common postural conditions we treat at Shree Ganpati Clinic. With extended hours spent on computers and smartphones, the natural lordotic curve of the cervical spine is under constant strain.

### Why Does Neck Pain Radiate?
When cervical disc spaces narrow or undergo osteophyte formation, cervical nerve roots can experience mild compression, causing tingling down the arm, thumb, or shoulder blade.

### 4 Key Therapeutic Protocols:
1. **Chin Tucks (Deep Cervical Flexor Activation)**: Gently retract your chin straight back as if creating a double chin. Hold for 5 seconds and repeat 10 times.
2. **Isometric Neck Contractions**: Press your palm against your forehead without letting your head move. Hold for 6 seconds; repeat for the back and sides.
3. **Levator Scapulae Stretch**: Turn head 45 degrees to the left, look down toward your armpit, and gently apply light overpressure with the left hand.
4. **Thoracic Extension Mobilization**: Use a rolled towel behind your mid-back to open up the chest cavity and decompress the upper spine.

*Note: If you experience sharp shooting pain or dizziness, book an in-person assessment before continuing high-intensity stretches.*`,
    category: 'Cervical & Neck Relief',
    author: 'Dr. Gaurav Sharma (BPT, MPT Ortho)',
    coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=RcU_p0VbI14',
    readTime: '4 min read',
    isFeatured: true,
    tags: ['Cervical', 'Neck Pain', 'Home Exercises', 'Spine Health'],
  },
  {
    title: 'How Spinal Decompression & Core Stabilization Heal Sciatica',
    slug: 'spinal-decompression-core-stabilization-sciatica',
    excerpt: 'Understanding herniated lumbar discs, L4-L5 nerve root irritation, and non-surgical decompression protocols used at our Nadaun clinic.',
    content: `Sciatica refers to pain radiating along the path of the sciatic nerve—branching from your lower back through your hips, buttocks, and down each leg.

### How Physiotherapy Relieves Lumbar Disc Pressure:
1. **Targeted Mechanical Traction & Decompression**: Gently separates compressed lumbar vertebrae to create negative intra-discal pressure, allowing herniated disc material to retract.
2. **McKenzie Extension Principles**: Centralizes peripheral leg pain back to the midline lower back.
3. **Transverse Abdominis & Multifidus Activation**: Building a natural muscular corset around the spine to prevent re-herniation during daily lifting and walking.

At Shree Ganpati Ortho & Spine Clinic, our customized 3-phase sciatica protocol ensures patients avoid invasive surgeries and regain pain-free mobility.`,
    category: 'Spine & Posture Care',
    author: 'Dr. Gaurav Sharma (BPT, MPT Ortho)',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=jfnWnL4Lz_8',
    readTime: '5 min read',
    isFeatured: false,
    tags: ['Sciatica', 'Lower Back Pain', 'Spinal Decompression', 'Disc Rehab'],
  },
  {
    title: 'Post-Op ACL & Meniscus Rehabilitation: A Phase-by-Phase Roadmap',
    slug: 'post-op-acl-meniscus-rehabilitation-roadmap',
    excerpt: 'Complete recovery guide from early knee extension restoration to plyometric sports conditioning and proprioceptive balance.',
    content: `Recovering from ACL reconstruction or meniscus repair requires progressive loading, strict swelling management, and targeted neuromuscular re-education.

### Key Milestones:
- **Phase 1 (Weeks 1-2)**: Full passive knee extension (0 degrees) is paramount. Quad sets, patellar mobilizations, and cold compression therapy.
- **Phase 2 (Weeks 3-6)**: Normalizing gait pattern, closed kinetic chain strengthening (mini squats, leg press), and stationary cycling.
- **Phase 3 (Months 2-4)**: Hamstring-to-quad strength ratio balancing, single-leg balance boards, and eccentric loading.
- **Phase 4 (Months 5+)**: Agility drills, deceleration training, and sports-specific return to sport testing.`,
    category: 'Knee & Joint Rehab',
    author: 'Dr. Gaurav Sharma (BPT, MPT Ortho)',
    coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=2K6mHqGvO9E',
    readTime: '6 min read',
    isFeatured: false,
    tags: ['ACL Rehab', 'Knee Pain', 'Sports Physiotherapy', 'Joint Mobility'],
  }
];

// @route   GET /api/v1/blogs
// @desc    Get all published blogs with optional category & search filter (Public)
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let blogs = await Blog.find(query).sort({ createdAt: -1 });

    // Seed defaults if collection is empty
    if (blogs.length === 0 && !category && !search) {
      await Blog.insertMany(SEED_BLOGS);
      blogs = await Blog.find().sort({ createdAt: -1 });
    }

    res.json(blogs);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/blogs/:idOrSlug
// @desc    Get single blog post detail by ID or Slug (Public)
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let blog;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(idOrSlug);
    } else {
      blog = await Blog.findOne({ slug: idOrSlug });
    }

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json(blog);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/blogs
// @desc    Create a new blog post (Admin only)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, excerpt, content, category, author, coverImage, videoUrl, readTime, isFeatured, tags } = req.body;

    if (!title || !excerpt || !content) {
      return res.status(400).json({ message: 'Title, summary, and content are required' });
    }

    const blog = await Blog.create({
      title,
      excerpt,
      content,
      category: category || 'Spine & Posture Care',
      author: author || 'Dr. Gaurav Sharma (BPT, MPT Ortho)',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
      videoUrl: videoUrl || '',
      readTime: readTime || '4 min read',
      isFeatured: !!isFeatured,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Physiotherapy']),
    });

    res.status(201).json(blog);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/v1/blogs/:id
// @desc    Update a blog post (Admin only)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { title, excerpt, content, category, author, coverImage, videoUrl, readTime, isFeatured, tags } = req.body;

    const payload = {
      ...(title && { title }),
      ...(excerpt && { excerpt }),
      ...(content && { content }),
      ...(category && { category }),
      ...(author && { author }),
      ...(coverImage && { coverImage }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(readTime && { readTime }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(tags && { tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()) }),
    };

    const blog = await Blog.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json(blog);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/blogs/:id
// @desc    Delete a blog post (Admin only)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
