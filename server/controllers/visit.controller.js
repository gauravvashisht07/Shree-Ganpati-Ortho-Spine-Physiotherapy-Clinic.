const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Doctor = require('../models/Doctor');
const {
  resolveOrCreatePatient,
  recordClinicalVisit,
  syncPatientVisitStats
} = require('../services/patientVisit.service');

/**
 * 1. RECORD A NEW CLINICAL VISIT (Supports backdated/historical visits)
 */
exports.createVisit = async (req, res) => {
  try {
    let {
      patientId,
      patientName,
      patientPhone,
      patientEmail,
      patientAddress,
      patientAge,
      patientGender,
      doctorId,
      serviceId,
      visitDate,
      timeSlot,
      visitType,
      fee,
      paymentStatus,
      notes
    } = req.body;

    if (!visitDate) {
      return res.status(400).json({ message: 'Actual Visit Date is required (YYYY-MM-DD)' });
    }

    // Normalize date format if required
    if (typeof visitDate === 'string') {
      const parts = visitDate.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          visitDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          visitDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    // If patientId is not provided, resolve or create the patient
    if (!patientId) {
      if (!patientName || !patientName.trim()) {
        return res.status(400).json({ message: 'Patient Name is required' });
      }

      const patient = await resolveOrCreatePatient({
        patientName,
        patientPhone,
        patientEmail,
        patientAddress,
        patientAge,
        patientGender,
        registrationDate: visitDate // defaults to the visit date if it's their first record!
      });
      patientId = patient._id;
    } else {
      // If patient exists, optionally update any newer address/age/gender if provided
      const existingPatient = await Patient.findById(patientId);
      if (existingPatient) {
        let changed = false;
        if (patientAddress && !existingPatient.address) {
          existingPatient.address = patientAddress.trim();
          changed = true;
        }
        if (patientAge && !existingPatient.age) {
          existingPatient.age = Number(patientAge);
          changed = true;
        }
        if (patientGender && !existingPatient.gender) {
          existingPatient.gender = patientGender.trim().toLowerCase();
          changed = true;
        }
        if (changed) await existingPatient.save();
      }
    }

    // Record the clinical visit
    const visit = await recordClinicalVisit({
      patientId,
      doctorId,
      serviceId,
      visitDate,
      timeSlot: timeSlot || '10:00 AM',
      visitType: visitType || 'consultation',
      status: 'completed',
      fee,
      paymentStatus: paymentStatus || 'paid',
      notes: (notes || '').trim(),
      patientAddress,
      patientAge,
      patientGender
    });

    const populatedVisit = await Visit.findById(visit._id)
      .populate('patientId', 'patientId name phone email address age gender totalVisits firstVisitDate lastVisitDate')
      .populate('doctorId', 'name specialization')
      .populate('serviceId', 'name price duration');

    res.status(201).json({
      message: 'Clinical visit recorded successfully',
      visit: populatedVisit
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ message: error.message || 'Failed to record visit', error: error.message });
  }
};

/**
 * 2. GET ALL CLINICAL VISITS with date, doctor, service, and patient filters
 */
exports.getVisits = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      serviceId,
      date,
      startDate,
      endDate,
      status
    } = req.query;

    const query = {};
    if (patientId) query.patientId = patientId;
    if (doctorId && doctorId !== 'All') query.doctorId = doctorId;
    if (serviceId && serviceId !== 'All') query.serviceId = serviceId;
    if (status && status !== 'All') query.status = status;

    if (date) {
      query.visitDate = date;
    } else if (startDate && endDate) {
      query.visitDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.visitDate = { $gte: startDate };
    } else if (endDate) {
      query.visitDate = { $lte: endDate };
    }

    const visits = await Visit.find(query)
      .populate('patientId', 'patientId name phone email address age gender totalVisits firstVisitDate lastVisitDate')
      .populate('doctorId', 'name specialization')
      .populate('serviceId', 'name price duration')
      .sort({ visitDate: -1, timeSlot: -1, createdAt: -1 })
      .lean();

    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ message: 'Failed to retrieve visits', error: error.message });
  }
};

/**
 * 3. UPDATE AN EXISTING CLINICAL VISIT (Change visit date, notes, service, doctor, payment)
 */
exports.updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      visitDate,
      timeSlot,
      visitType,
      doctorId,
      serviceId,
      fee,
      paymentStatus,
      notes,
      status
    } = req.body;

    const visit = await Visit.findById(id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit record not found' });
    }

    if (visitDate) visit.visitDate = visitDate;
    if (timeSlot) visit.timeSlot = timeSlot;
    if (visitType) visit.visitType = visitType;
    if (doctorId) visit.doctorId = doctorId;
    if (serviceId) visit.serviceId = serviceId;
    if (fee !== undefined) visit.fee = Number(fee);
    if (paymentStatus) visit.paymentStatus = paymentStatus;
    if (notes !== undefined) visit.notes = notes.trim();
    if (status) visit.status = status;

    await visit.save();

    // Re-synchronize patient first/last visit dates and total counts
    const updatedStats = await syncPatientVisitStats(visit.patientId);

    const populatedVisit = await Visit.findById(visit._id)
      .populate('patientId', 'patientId name phone email address age gender totalVisits firstVisitDate lastVisitDate')
      .populate('doctorId', 'name specialization')
      .populate('serviceId', 'name price duration');

    res.json({
      message: 'Visit record updated successfully',
      visit: populatedVisit,
      patientStats: updatedStats
    });
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ message: error.message || 'Failed to update visit', error: error.message });
  }
};

/**
 * 4. DELETE A CLINICAL VISIT (Does NOT delete patient permanent record)
 */
exports.deleteVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await Visit.findById(id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit record not found' });
    }

    const patientId = visit.patientId;
    await Visit.findByIdAndDelete(id);

    // Re-synchronize patient visit stats
    const updatedStats = await syncPatientVisitStats(patientId);

    res.json({
      message: 'Visit record removed successfully',
      id,
      patientStats: updatedStats
    });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ message: 'Failed to delete visit', error: error.message });
  }
};
