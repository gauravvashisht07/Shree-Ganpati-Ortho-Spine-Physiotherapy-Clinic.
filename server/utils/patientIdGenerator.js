const Patient = require('../models/Patient');

/**
 * Generates the next sequential Clinic Patient ID (e.g., SGP-1001, SGP-1002...)
 */
async function generateNextPatientId() {
  try {
    const latestPatient = await Patient.findOne({
      patientId: { $regex: /^SGP-\d+$/ }
    }).sort({ patientId: -1 }).select('patientId').lean();

    if (!latestPatient || !latestPatient.patientId) {
      return 'SGP-1001';
    }

    const match = latestPatient.patientId.match(/^SGP-(\d+)$/);
    if (match && match[1]) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `SGP-${nextNum}`;
    }

    return 'SGP-1001';
  } catch (error) {
    console.warn('Error generating patient ID, falling back to timestamp:', error.message);
    return `SGP-${Date.now().toString().slice(-4)}`;
  }
}

/**
 * Normalizes phone numbers to standard 10-digit format for Indian/global numbers
 */
function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

module.exports = {
  generateNextPatientId,
  normalizePhoneNumber
};
