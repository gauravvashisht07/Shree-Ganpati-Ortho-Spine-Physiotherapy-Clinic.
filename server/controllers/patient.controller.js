const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Appointment = require('../models/Appointment');
const {
  normalizePhone,
  syncPatientVisitStats,
  searchExistingPatients,
  resolveOrCreatePatient
} = require('../services/patientVisit.service');

/**
 * 1. GET ALL PATIENTS with comprehensive search, date filtering, and status filtering
 */
exports.getPatients = async (req, res) => {
  try {
    const {
      search,
      date,
      startDate,
      endDate,
      filterType, // 'all', 'visited', 'new', 'returning', 'no-visits'
      sort = 'lastVisit'
    } = req.query;

    const query = {};

    // 1. Text Search across name, patientId, phone, normalized phone, address, email
    if (search && search.trim()) {
      const term = search.trim();
      const normalized = normalizePhone(term);
      const orConditions = [
        { name: { $regex: term, $options: 'i' } },
        { patientId: { $regex: term, $options: 'i' } },
        { address: { $regex: term, $options: 'i' } }
      ];

      if (term.includes('@')) {
        orConditions.push({ email: term.toLowerCase() });
      }

      if (normalized && normalized.length >= 4) {
        orConditions.push({ phoneNormalized: { $regex: normalized } });
        orConditions.push({ phone: { $regex: normalized } });
      }

      query.$or = orConditions;
    }

    // 2. Date-based filtering for actual clinical visits
    let patientIdsInDateRange = null;
    let effectiveStart = null;
    let effectiveEnd = null;

    if (date) {
      effectiveStart = date;
      effectiveEnd = date;
    } else if (startDate || endDate) {
      effectiveStart = startDate || '1970-01-01';
      effectiveEnd = endDate || '2099-12-31';
    }

    if (effectiveStart && effectiveEnd) {
      const visitsInRange = await Visit.find({
        visitDate: { $gte: effectiveStart, $lte: effectiveEnd },
        status: 'completed'
      }).distinct('patientId');

      patientIdsInDateRange = visitsInRange.map(id => id.toString());
    }

    // Apply filterType
    if (filterType === 'no-visits') {
      query.totalVisits = 0;
    } else if (filterType === 'new') {
      if (effectiveStart && effectiveEnd) {
        query.firstVisitDate = { $gte: effectiveStart, $lte: effectiveEnd };
      } else {
        query.totalVisits = 1;
      }
    } else if (filterType === 'returning') {
      if (effectiveStart && effectiveEnd && patientIdsInDateRange !== null) {
        query._id = { $in: patientIdsInDateRange };
        query.firstVisitDate = { $lt: effectiveStart };
      } else {
        query.totalVisits = { $gt: 1 };
      }
    } else if (patientIdsInDateRange !== null) {
      query._id = { $in: patientIdsInDateRange };
    }

    // Sorting
    let sortObj = { lastVisitDate: -1, createdAt: -1 };
    if (sort === 'firstVisit') sortObj = { firstVisitDate: 1, createdAt: 1 };
    if (sort === 'totalVisitsDesc') sortObj = { totalVisits: -1, lastVisitDate: -1 };
    if (sort === 'totalVisitsAsc') sortObj = { totalVisits: 1, lastVisitDate: -1 };
    if (sort === 'name') sortObj = { name: 1 };
    if (sort === 'patientId') sortObj = { patientId: 1 };

    const totalFilteredCount = await Patient.countDocuments(query);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;

    const patients = await Patient.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Summary counts for directory badges
    const totalPatientsCount = await Patient.countDocuments();
    const noVisitsCount = await Patient.countDocuments({
      $or: [{ totalVisits: 0 }, { totalVisits: { $exists: false } }]
    });

    res.json({
      patients,
      totalCount: totalFilteredCount,
      page,
      totalPages: Math.ceil(totalFilteredCount / limit),
      stats: {
        totalRegistered: totalPatientsCount,
        noVisitsYet: noVisitsCount,
        inFilteredView: totalFilteredCount
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ message: 'Failed to retrieve patients', error: error.message });
  }
};

/**
 * 2. SEARCH PATIENTS FOR DUPLICATE DETECTION & AUTOCOMPLETE
 */
exports.searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const matches = await searchExistingPatients(q);
    res.json(matches);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ message: 'Search error', error: error.message });
  }
};

/**
 * 3. GET SINGLE PATIENT PROFILE & COMPLETE VISIT HISTORY
 */
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    let patient = null;
    if (id.startsWith('SGP-')) {
      patient = await Patient.findOne({ patientId: id.toUpperCase() }).lean();
    } else {
      patient = await Patient.findById(id).lean();
    }

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch all clinical visits for this patient (chronological, newest first)
    const visits = await Visit.find({ patientId: patient._id })
      .populate('doctorId', 'name specialization')
      .populate('serviceId', 'name price duration')
      .sort({ visitDate: -1, timeSlot: -1, createdAt: -1 })
      .lean();

    // Fetch planned upcoming appointments (non-completed/pending/confirmed)
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'name')
      .populate('serviceId', 'name price')
      .sort({ date: -1, timeSlot: -1 })
      .lean();

    // Re-verify visit metrics
    const completedVisits = visits.filter(v => v.status === 'completed');
    const totalVisits = completedVisits.length;
    const firstVisitDate = completedVisits.length > 0 ? completedVisits[completedVisits.length - 1].visitDate : null;
    const lastVisitDate = completedVisits.length > 0 ? completedVisits[0].visitDate : null;

    res.json({
      patient: {
        ...patient,
        totalVisits,
        firstVisitDate,
        lastVisitDate
      },
      visits,
      appointments
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ message: 'Failed to retrieve patient profile', error: error.message });
  }
};

/**
 * 4. REGISTER NEW PATIENT
 */
exports.createPatient = async (req, res) => {
  try {
    const newPatient = await resolveOrCreatePatient(req.body);
    res.status(201).json({
      message: 'Patient registered successfully',
      patient: newPatient
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ message: error.message || 'Failed to create patient', error: error.message });
  }
};

/**
 * 5. UPDATE PATIENT PROFILE
 */
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      address,
      age,
      gender,
      registrationDate
    } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (name && name.trim()) patient.name = name.trim();
    if (phone !== undefined) {
      patient.phone = phone.trim();
      patient.phoneNormalized = normalizePhone(phone.trim());
    }
    if (email !== undefined) {
      patient.email = email.trim() ? email.trim().toLowerCase() : patient.email;
    }
    if (address !== undefined) patient.address = address.trim();
    if (age !== undefined && age !== '') patient.age = Number(age);
    if (gender !== undefined) patient.gender = gender.trim().toLowerCase();
    if (registrationDate) patient.registrationDate = registrationDate;

    await patient.save();

    // Re-sync visit stats
    await syncPatientVisitStats(patient._id);

    res.json({
      message: 'Patient profile updated successfully',
      patient
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ message: error.message || 'Failed to update patient', error: error.message });
  }
};

/**
 * 6. DELETE PATIENT RECORD (with safety checks)
 */
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Clean up any orphan visits and appointments
    await Visit.deleteMany({ patientId: id });
    await Appointment.deleteMany({ patientId: id });
    await Patient.findByIdAndDelete(id);

    res.json({ message: `Patient ${patient.name} (${patient.patientId || ''}) and associated history deleted successfully`, id });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ message: 'Failed to delete patient', error: error.message });
  }
};
