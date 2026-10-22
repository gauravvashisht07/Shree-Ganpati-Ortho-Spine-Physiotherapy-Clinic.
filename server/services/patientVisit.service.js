const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Service = require('../models/Service');
const Doctor = require('../models/Doctor');
const { generateNextPatientId, normalizePhoneNumber } = require('../utils/patientIdGenerator');

/**
 * Normalizes phone string to clean 10-digit format
 */
function normalizePhone(phone) {
  return normalizePhoneNumber(phone);
}

/**
 * Recalculates totalVisits, firstVisitDate, and lastVisitDate for a patient
 * based on all completed visits in the Visit collection.
 */
async function syncPatientVisitStats(patientId) {
  if (!patientId) return null;

  const completedVisits = await Visit.find({
    patientId,
    status: 'completed'
  })
    .sort({ visitDate: 1 })
    .lean();

  const totalVisits = completedVisits.length;
  const firstVisitDate = totalVisits > 0 ? completedVisits[0].visitDate : null;
  const lastVisitDate = totalVisits > 0 ? completedVisits[completedVisits.length - 1].visitDate : null;

  const updatedPatient = await Patient.findByIdAndUpdate(
    patientId,
    {
      totalVisits,
      firstVisitDate,
      lastVisitDate
    },
    { returnDocument: 'after' }
  );

  return {
    totalVisits,
    firstVisitDate,
    lastVisitDate,
    patient: updatedPatient
  };
}

/**
 * Searches for existing patients using phone number (normalized),
 * name, email, or unique patient ID (e.g. SGP-1001).
 */
async function searchExistingPatients(term) {
  if (!term || typeof term !== 'string' || !term.trim()) {
    return [];
  }

  const cleanTerm = term.trim();
  const normalized = normalizePhone(cleanTerm);

  const orConditions = [
    { name: { $regex: cleanTerm, $options: 'i' } },
    { patientId: { $regex: cleanTerm, $options: 'i' } }
  ];

  if (cleanTerm.includes('@')) {
    orConditions.push({ email: cleanTerm.toLowerCase() });
  }

  if (normalized && normalized.length >= 4) {
    orConditions.push({ phoneNormalized: { $regex: normalized } });
    orConditions.push({ phone: { $regex: normalized } });
  }

  const matchedPatients = await Patient.find({ $or: orConditions })
    .sort({ lastVisitDate: -1, createdAt: -1 })
    .limit(10)
    .lean();

  return matchedPatients;
}

/**
 * Finds an existing patient or creates a new one with a sequential patientId.
 * Does not silently create duplicates if phone matches.
 */
async function resolveOrCreatePatient(data) {
  const {
    patientId: existingPatientId, // MongoDB _id or clinic ID
    patientName,
    name,
    patientPhone,
    phone,
    patientEmail,
    email,
    patientAddress,
    address,
    patientAge,
    age,
    patientGender,
    gender,
    registrationDate
  } = data;

  const cleanName = (patientName || name || '').trim();
  const rawPhone = (patientPhone || phone || '').trim();
  const normalizedPhone = normalizePhone(rawPhone);
  const rawEmail = (patientEmail || email || '').trim().toLowerCase();
  const finalAddress = (patientAddress || address || '').trim();
  const finalAge = patientAge !== undefined && patientAge !== '' 
    ? Number(patientAge) 
    : (age !== undefined && age !== '' ? Number(age) : undefined);
  const finalGender = (patientGender || gender || '').trim().toLowerCase();

  let patient = null;

  // 1. If explicit MongoDB ID provided
  if (existingPatientId) {
    patient = await Patient.findById(existingPatientId);
  }

  // 2. Try matching by unique Clinic ID (e.g. SGP-1001)
  if (!patient && existingPatientId && typeof existingPatientId === 'string' && existingPatientId.startsWith('SGP-')) {
    patient = await Patient.findOne({ patientId: existingPatientId.toUpperCase() });
  }

  // 3. Match by normalized phone (if at least 10 digits)
  if (!patient && normalizedPhone && normalizedPhone.length >= 10) {
    patient = await Patient.findOne({
      $or: [
        { phoneNormalized: normalizedPhone },
        { phone: rawPhone },
        { phone: normalizedPhone }
      ]
    });
  }

  // 4. Match by real email (excluding dummy @clinic.local emails)
  if (!patient && rawEmail && !rawEmail.endsWith('@clinic.local')) {
    patient = await Patient.findOne({ email: rawEmail });
  }

  // If patient found, update any newer non-conflicting profile details
  if (patient) {
    let changed = false;
    if (rawPhone && !patient.phone) {
      patient.phone = rawPhone;
      patient.phoneNormalized = normalizedPhone;
      changed = true;
    } else if (normalizedPhone && !patient.phoneNormalized) {
      patient.phoneNormalized = normalizedPhone;
      changed = true;
    }

    if (rawEmail && (!patient.email || patient.email.endsWith('@clinic.local'))) {
      patient.email = rawEmail;
      changed = true;
    }
    if (finalAddress && (!patient.address || patient.address !== finalAddress)) {
      patient.address = finalAddress;
      changed = true;
    }
    if (finalAge !== undefined && patient.age !== finalAge) {
      patient.age = finalAge;
      changed = true;
    }
    if (finalGender && patient.gender !== finalGender) {
      patient.gender = finalGender;
      changed = true;
    }
    if (!patient.patientId) {
      patient.patientId = await generateNextPatientId();
      changed = true;
    }
    if (changed) {
      await patient.save();
    }
    return patient;
  }

  // If not found, create new permanent patient record
  let cleanEmail = rawEmail;
  if (!cleanEmail) {
    if (normalizedPhone) {
      cleanEmail = `${normalizedPhone}@clinic.local`;
    } else {
      cleanEmail = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@clinic.local`;
    }
  }

  const newPatientId = await generateNextPatientId();
  const regDate = registrationDate || new Date().toISOString().split('T')[0];

  const newPatient = await Patient.create({
    patientId: newPatientId,
    name: cleanName || 'New Patient',
    email: cleanEmail,
    phone: rawPhone || undefined,
    phoneNormalized: normalizedPhone || undefined,
    address: finalAddress || undefined,
    age: finalAge,
    gender: finalGender || undefined,
    role: 'patient',
    totalVisits: 0,
    firstVisitDate: null,
    lastVisitDate: null,
    registrationDate: regDate
  });

  return newPatient;
}

/**
 * Records a clinical visit for a patient.
 * Supports historical dates and automatically updates first/last visit dates.
 */
async function recordClinicalVisit(visitData) {
  const {
    patientId,
    doctorId,
    serviceId,
    visitDate,
    timeSlot,
    visitType,
    status,
    fee,
    paymentStatus,
    notes,
    patientAddress,
    patientAge,
    patientGender,
    appointmentId
  } = visitData;

  if (!patientId) {
    throw new Error('Patient ID is required to record a clinical visit');
  }
  if (!visitDate) {
    throw new Error('Visit date is required');
  }

  // Prevent accidental rapid duplicate visit submission
  const existingVisit = await Visit.findOne({
    patientId,
    visitDate,
    timeSlot: timeSlot || '10:00 AM',
    serviceId: serviceId || null,
    status: status || 'completed'
  });

  if (existingVisit && !appointmentId) {
    // If exact same visit submitted within 2 minutes, return existing record to prevent duplicates
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (existingVisit.createdAt > twoMinutesAgo) {
      return existingVisit;
    }
  }

  // Resolve service price for fee if not provided
  let calculatedFee = fee !== undefined && fee !== null ? Number(fee) : 0;
  if (calculatedFee === 0 && serviceId) {
    const svc = await Service.findById(serviceId).lean();
    if (svc && svc.price) {
      calculatedFee = svc.price;
    }
  }

  const visit = await Visit.create({
    patientId,
    appointmentId: appointmentId || undefined,
    doctorId: doctorId || undefined,
    serviceId: serviceId || undefined,
    visitDate,
    timeSlot: timeSlot || '10:00 AM',
    visitType: visitType || 'consultation',
    status: status || 'completed',
    fee: calculatedFee,
    paymentStatus: paymentStatus || 'paid',
    notes: (notes || '').trim(),
    patientAddress: (patientAddress || '').trim(),
    patientAge: patientAge !== undefined ? Number(patientAge) : undefined,
    patientGender: (patientGender || '').trim()
  });

  // Re-synchronize patient visit stats
  await syncPatientVisitStats(patientId);

  return visit;
}

/**
 * Synchronizes an Appointment to a Visit record whenever its status changes.
 * - When status === 'completed', a Visit record is guaranteed to exist.
 * - When status !== 'completed', any linked completed Visit is marked cancelled.
 */
async function syncAppointmentToVisit(appointment) {
  if (!appointment || !appointment.patientId) return null;

  const patientId = appointment.patientId._id || appointment.patientId;

  if (appointment.status === 'completed') {
    let visit = await Visit.findOne({ appointmentId: appointment._id });
    if (!visit) {
      // Create new visit record
      let fee = 0;
      if (appointment.serviceId) {
        const svc = appointment.serviceId.price !== undefined 
          ? appointment.serviceId 
          : await Service.findById(appointment.serviceId).lean();
        if (svc) fee = svc.price || 0;
      }

      visit = await Visit.create({
        patientId,
        appointmentId: appointment._id,
        doctorId: appointment.doctorId?._id || appointment.doctorId,
        serviceId: appointment.serviceId?._id || appointment.serviceId,
        visitDate: appointment.date,
        timeSlot: appointment.timeSlot,
        visitType: 'consultation',
        status: 'completed',
        fee,
        paymentStatus: appointment.paymentStatus === 'paid' ? 'paid' : 'unpaid',
        notes: appointment.notes || '',
        patientAddress: appointment.patientAddress || '',
        patientAge: appointment.patientAge,
        patientGender: appointment.patientGender
      });
    } else {
      // Update existing visit
      visit.visitDate = appointment.date;
      visit.timeSlot = appointment.timeSlot;
      visit.status = 'completed';
      visit.paymentStatus = appointment.paymentStatus === 'paid' ? 'paid' : 'unpaid';
      if (appointment.notes !== undefined) visit.notes = appointment.notes;
      await visit.save();
    }

    await syncPatientVisitStats(patientId);
    return visit;
  } else {
    // If appointment is pending, cancelled, or no-show, ensure any linked visit is cancelled
    const visit = await Visit.findOne({ appointmentId: appointment._id });
    if (visit) {
      visit.status = 'cancelled';
      await visit.save();
      await syncPatientVisitStats(patientId);
    }
    return null;
  }
}

module.exports = {
  normalizePhone,
  syncPatientVisitStats,
  searchExistingPatients,
  resolveOrCreatePatient,
  recordClinicalVisit,
  syncAppointmentToVisit
};
