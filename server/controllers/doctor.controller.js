const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');
const { generateSlots } = require('../services/slotGenerator');

exports.getAll = async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-passwordHash');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-passwordHash');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, specialization, slotDuration, isActive } = req.body;
    
    let passwordHash;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    let specs = [];
    if (Array.isArray(specialization)) {
      specs = specialization;
    } else if (typeof specialization === 'string' && specialization.trim()) {
      specs = specialization.split(',').map(s => s.trim()).filter(Boolean);
    }

    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim() : undefined;

    const newDoctor = await Doctor.create({
      name: name?.trim(),
      email: cleanEmail,
      passwordHash,
      specialization: specs,
      slotDuration: Number(slotDuration) || 30,
      isActive: isActive !== undefined ? isActive : true,
      role: 'doctor'
    });

    const docObj = newDoctor.toObject();
    delete docObj.passwordHash;

    res.status(201).json(docObj);
  } catch (error) {
    res.status(400).json({ message: 'Error creating doctor', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    if (updateData.specialization && typeof updateData.specialization === 'string') {
        updateData.specialization = updateData.specialization.split(',').map(s => s.trim());
    }

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-passwordHash');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    
    res.json(doctor);
  } catch (error) {
    res.status(400).json({ message: 'Error updating doctor', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date query parameter is required (YYYY-MM-DD)' });
    
    const slots = await generateSlots(req.params.id, date);
    res.json(slots);
  } catch (error) {
    if (error.message === 'Doctor not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
