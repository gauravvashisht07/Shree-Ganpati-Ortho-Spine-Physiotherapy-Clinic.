const Service = require('../models/Service');

exports.getAll = async (req, res) => {
  try {
    const services = await Service.find().populate('doctorIds', 'name');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('doctorIds', 'name');
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, duration, price } = req.body;
    const newService = await Service.create({ name, description, duration, price });
    res.status(201).json(newService);
  } catch (error) {
    res.status(400).json({ message: 'Error creating service', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: 'Error updating service', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
