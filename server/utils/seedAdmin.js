const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    const defaultEmail = (process.env.ADMIN_EMAIL || 'shreeganpatiorthospinephysio@gmail.com').toLowerCase();
    const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@Ganpati2026!';
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const admin = await Admin.findOneAndUpdate(
      { email: defaultEmail },
      {
        name: 'Master Admin',
        email: defaultEmail,
        passwordHash,
        role: 'admin'
      },
      { upsert: true, returnDocument: 'after' }
    );

    console.log(`Default admin synchronized: ${admin.email} (Password: ${defaultPassword})`);
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

module.exports = seedAdmin;
