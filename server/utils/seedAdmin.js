const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    const defaultEmail = (process.env.ADMIN_EMAIL || 'admin@shreeganpati.com').toLowerCase();
    const existing = await Admin.findOne({ email: defaultEmail });
    if (!existing) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@Ganpati2026!';
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      await Admin.create({
        name: 'Master Admin',
        email: defaultEmail,
        passwordHash,
        role: 'admin'
      });

      console.log(`Default admin seeded successfully: ${defaultEmail}`);
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

module.exports = seedAdmin;
