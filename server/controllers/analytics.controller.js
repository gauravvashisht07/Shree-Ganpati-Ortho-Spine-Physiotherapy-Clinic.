const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Doctor = require('../models/Doctor');
const Visit = require('../models/Visit');

// Helper to calculate date boundaries
function getISODateOnly(d = new Date()) {
  return d.toISOString().split('T')[0];
}

// Age Group classifier
function classifyAge(age) {
  if (age === null || age === undefined || isNaN(age)) return 'Unknown';
  const num = Number(age);
  if (num < 0) return 'Unknown';
  if (num <= 12) return 'Children (0-12)';
  if (num <= 19) return 'Teenagers (13-19)';
  if (num <= 35) return 'Young Adults (20-35)';
  if (num <= 50) return 'Adults (36-50)';
  if (num <= 65) return 'Middle-Aged (51-65)';
  return 'Seniors (66+)';
}

const AGE_GROUPS_ORDER = [
  'Children (0-12)',
  'Teenagers (13-19)',
  'Young Adults (20-35)',
  'Adults (36-50)',
  'Middle-Aged (51-65)',
  'Seniors (66+)',
  'Unknown'
];

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const STANDARD_SLOTS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

function normalizeTimeSlotDisplay(rawSlot) {
  if (!rawSlot) return '';
  const s = rawSlot.trim().toUpperCase();
  if (s.includes('AM') || s.includes('PM')) return s;
  const parts = s.split(':');
  if (parts.length === 2) {
    let h = parseInt(parts[0], 10);
    const m = parts[1].padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  }
  return s;
}

// Build common filter for appointments based on query parameters
function buildAppointmentQuery(query) {
  const filter = {};
  const { startDate, endDate, doctorId, serviceId, status, gender, ageGroup } = query;

  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.date = { $gte: startDate };
  } else if (endDate) {
    filter.date = { $lte: endDate };
  }

  if (doctorId && doctorId !== 'All') {
    filter.doctorId = doctorId;
  }
  if (serviceId && serviceId !== 'All') {
    filter.serviceId = serviceId;
  }
  if (status && status !== 'All') {
    filter.status = status;
  }
  if (gender && gender !== 'All') {
    filter.patientGender = gender.toLowerCase();
  }

  if (ageGroup && ageGroup !== 'All') {
    switch (ageGroup) {
      case 'Children (0-12)': filter.patientAge = { $gte: 0, $lte: 12 }; break;
      case 'Teenagers (13-19)': filter.patientAge = { $gte: 13, $lte: 19 }; break;
      case 'Young Adults (20-35)': filter.patientAge = { $gte: 20, $lte: 35 }; break;
      case 'Adults (36-50)': filter.patientAge = { $gte: 36, $lte: 50 }; break;
      case 'Middle-Aged (51-65)': filter.patientAge = { $gte: 51, $lte: 65 }; break;
      case 'Seniors (66+)': filter.patientAge = { $gte: 66 }; break;
      case 'Unknown': filter.$or = [{ patientAge: { $exists: false } }, { patientAge: null }]; break;
    }
  }

  return filter;
}

// Build common filter for clinical visits based on query parameters
function buildVisitQuery(query) {
  const filter = { status: 'completed' };
  const { startDate, endDate, doctorId, serviceId, gender, ageGroup } = query;

  if (startDate && endDate) {
    filter.visitDate = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.visitDate = { $gte: startDate };
  } else if (endDate) {
    filter.visitDate = { $lte: endDate };
  }

  if (doctorId && doctorId !== 'All') {
    filter.doctorId = doctorId;
  }
  if (serviceId && serviceId !== 'All') {
    filter.serviceId = serviceId;
  }
  if (gender && gender !== 'All') {
    filter.patientGender = gender.toLowerCase();
  }

  if (ageGroup && ageGroup !== 'All') {
    switch (ageGroup) {
      case 'Children (0-12)': filter.patientAge = { $gte: 0, $lte: 12 }; break;
      case 'Teenagers (13-19)': filter.patientAge = { $gte: 13, $lte: 19 }; break;
      case 'Young Adults (20-35)': filter.patientAge = { $gte: 20, $lte: 35 }; break;
      case 'Adults (36-50)': filter.patientAge = { $gte: 36, $lte: 50 }; break;
      case 'Middle-Aged (51-65)': filter.patientAge = { $gte: 51, $lte: 65 }; break;
      case 'Seniors (66+)': filter.patientAge = { $gte: 66 }; break;
      case 'Unknown': filter.$or = [{ patientAge: { $exists: false } }, { patientAge: null }]; break;
    }
  }

  return filter;
}

/**
 * 1. OVERVIEW KPIS
 * Uses the Visit collection as source-of-truth for completed visits and actual visit dates,
 * and Appointment collection for planned bookings, cancellations, and no-shows.
 */
exports.getOverview = async (req, res) => {
  try {
    const today = getISODateOnly(new Date());
    const apptFilter = buildAppointmentQuery(req.query);
    const visitFilter = buildVisitQuery(req.query);

    // Filtered clinical visits in period
    const visitsInPeriod = await Visit.find(visitFilter).lean();
    const completedVisitsInPeriod = visitsInPeriod.length;

    let estimatedRevenue = 0;
    const uniquePatientsVisitedInPeriod = new Set();

    visitsInPeriod.forEach(v => {
      if (v.patientId) uniquePatientsVisitedInPeriod.add(v.patientId.toString());
      estimatedRevenue += (v.fee || 0);
    });

    // Filtered appointments in period
    const appointmentsInPeriod = await Appointment.find(apptFilter).lean();
    const totalAppointments = appointmentsInPeriod.length;

    let cancelledInPeriod = 0;
    let noShowInPeriod = 0;

    appointmentsInPeriod.forEach(app => {
      if (app.status === 'cancelled') {
        cancelledInPeriod += 1;
      } else if (app.status === 'no-show') {
        noShowInPeriod += 1;
      }
    });

    // Total unique registered patients in the clinic database
    const totalPatients = await Patient.countDocuments();

    // Patients with no recorded completed visits yet
    const patientsWithNoVisits = await Patient.countDocuments({
      $or: [{ totalVisits: 0 }, { totalVisits: { $exists: false } }]
    });

    // Today's appointments (all statuses)
    const todayAppointments = await Appointment.countDocuments({ date: today });

    // Today's completed visits (actual clinical visits on today's date)
    const todayCompletedVisits = await Visit.countDocuments({
      visitDate: today,
      status: 'completed'
    });

    // New patients this period:
    // Defined as unique patients whose very first recorded clinical visit date falls within the selected period
    let newPatientsInPeriodCount = 0;
    let returningPatientsCount = 0;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate || today;

    if (startDate) {
      newPatientsInPeriodCount = await Patient.countDocuments({
        firstVisitDate: { $gte: startDate, $lte: endDate }
      });

      // Returning patients in this period: visited in this period, but their first visit was earlier than startDate
      if (uniquePatientsVisitedInPeriod.size > 0) {
        const visitedPatientIds = Array.from(uniquePatientsVisitedInPeriod);
        returningPatientsCount = await Patient.countDocuments({
          _id: { $in: visitedPatientIds },
          firstVisitDate: { $lt: startDate }
        });
      }
    } else {
      // If all-time:
      newPatientsInPeriodCount = totalPatients - patientsWithNoVisits;
      returningPatientsCount = await Patient.countDocuments({ totalVisits: { $gt: 1 } });
    }

    const cancellationRate = totalAppointments > 0 
      ? Number(((cancelledInPeriod / totalAppointments) * 100).toFixed(1)) 
      : 0;

    const noShowRate = totalAppointments > 0 
      ? Number(((noShowInPeriod / totalAppointments) * 100).toFixed(1)) 
      : 0;

    const completionRate = totalAppointments > 0 
      ? Number(((completedVisitsInPeriod / totalAppointments) * 100).toFixed(1)) 
      : (completedVisitsInPeriod > 0 ? 100 : 0);

    res.json({
      totalPatients,
      patientsWithNoVisits,
      todayAppointments,
      todayCompletedVisits,
      totalVisitsInPeriod: completedVisitsInPeriod,
      uniquePatientsInPeriod: uniquePatientsVisitedInPeriod.size,
      totalAppointmentsInPeriod: totalAppointments,
      newPatientsInPeriod: newPatientsInPeriodCount,
      returningPatientsCount,
      cancellationRate,
      noShowRate,
      completionRate,
      estimatedRevenue,
      period: {
        startDate: req.query.startDate || 'All time',
        endDate: req.query.endDate || today
      }
    });
  } catch (error) {
    console.error('Analytics Overview Error:', error);
    res.status(500).json({ message: 'Failed to calculate overview analytics', error: error.message });
  }
};

/**
 * 2. DAILY, WEEKLY, AND MONTHLY VISIT TRENDS
 * Respects actual visitDate from Visit records for completed visits.
 */
exports.getVisitTrends = async (req, res) => {
  try {
    const apptFilter = buildAppointmentQuery(req.query);
    const visitFilter = buildVisitQuery(req.query);

    const [appointments, completedVisits] = await Promise.all([
      Appointment.find(apptFilter).lean(),
      Visit.find(visitFilter).lean()
    ]);

    // 1. Daily trends map
    const dailyMap = {};
    // 2. Monthly trends map
    const monthlyMap = {};
    // 3. Status distribution
    const statusCounts = { completed: completedVisits.length, confirmed: 0, pending: 0, cancelled: 0, 'no-show': 0 };

    appointments.forEach(app => {
      const d = app.date;
      const month = d.substring(0, 7); // YYYY-MM
      const st = app.status || 'pending';

      if (st !== 'completed') {
        if (statusCounts[st] !== undefined) {
          statusCounts[st] += 1;
        } else {
          statusCounts[st] = 1;
        }
      }

      // Daily
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, completed: 0, total: 0, cancelled: 0, noShow: 0 };
      }
      dailyMap[d].total += 1;
      if (st === 'cancelled') dailyMap[d].cancelled += 1;
      if (st === 'no-show') dailyMap[d].noShow += 1;

      // Monthly
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, completed: 0, total: 0 };
      }
      monthlyMap[month].total += 1;
    });

    // Populate completed visits based on actual visitDate
    completedVisits.forEach(v => {
      const d = v.visitDate;
      const month = d.substring(0, 7);

      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, completed: 0, total: 0, cancelled: 0, noShow: 0 };
      }
      dailyMap[d].completed += 1;
      if (dailyMap[d].total < dailyMap[d].completed) {
        dailyMap[d].total = dailyMap[d].completed;
      }

      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, completed: 0, total: 0 };
      }
      monthlyMap[month].completed += 1;
      if (monthlyMap[month].total < monthlyMap[month].completed) {
        monthlyMap[month].total = monthlyMap[month].completed;
      }
    });

    const dailyTrends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    const monthlyTrends = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Cumulative registered patient growth over time
    const patientGrowthData = await Patient.aggregate([
      {
        $group: {
          _id: { $substr: [{ $ifNull: ['$registrationDate', { $substr: ['$createdAt', 0, 10] }] }, 0, 7] },
          newRegistrations: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    let runningTotal = 0;
    const patientGrowth = patientGrowthData.map(item => {
      runningTotal += item.newRegistrations;
      return {
        month: item._id,
        newRegistrations: item.newRegistrations,
        cumulativePatients: runningTotal
      };
    });

    res.json({
      dailyTrends,
      monthlyTrends,
      statusDistribution: statusCounts,
      patientGrowth
    });
  } catch (error) {
    console.error('Analytics Visit Trends Error:', error);
    res.status(500).json({ message: 'Failed to calculate visit trends', error: error.message });
  }
};

/**
 * 3. DEMOGRAPHICS (AGE GROUPS & GENDER DISTRIBUTION)
 */
exports.getDemographics = async (req, res) => {
  try {
    const visitFilter = buildVisitQuery(req.query);

    // Fetch visits with populated patient details
    const visits = await Visit.find(visitFilter)
      .populate('patientId', 'name age gender phone address createdAt patientId')
      .populate('serviceId', 'name')
      .lean();

    const patientMap = new Map();

    visits.forEach(v => {
      const p = v.patientId;
      const patientId = p ? p._id.toString() : (v.patientAddress || 'anon');

      const effectiveAge = v.patientAge !== undefined && v.patientAge !== null 
        ? v.patientAge 
        : (p?.age !== undefined ? p.age : null);

      const effectiveGender = (v.patientGender || p?.gender || 'unknown').toLowerCase();

      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          id: p ? p._id : null,
          patientId: p?.patientId || '',
          name: p?.name || 'Anonymous',
          age: effectiveAge,
          gender: effectiveGender,
          phone: p?.phone || '',
          address: v.patientAddress || p?.address || '',
          completedVisits: 0,
          services: new Set()
        });
      }

      const rec = patientMap.get(patientId);
      rec.completedVisits += 1;
      if (v.serviceId?.name) rec.services.add(v.serviceId.name);
    });

    const uniquePatients = Array.from(patientMap.values()).map(p => ({
      ...p,
      services: Array.from(p.services)
    }));

    const totalPatientsAnalyzed = uniquePatients.length;

    // Age Groups aggregation
    const ageGroupCounts = {};
    const ageGroupPatients = {};
    AGE_GROUPS_ORDER.forEach(g => {
      ageGroupCounts[g] = 0;
      ageGroupPatients[g] = [];
    });

    uniquePatients.forEach(p => {
      const group = classifyAge(p.age);
      ageGroupCounts[group] = (ageGroupCounts[group] || 0) + 1;
      if (!ageGroupPatients[group]) ageGroupPatients[group] = [];
      ageGroupPatients[group].push({
        id: p.id,
        patientId: p.patientId,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        address: p.address,
        completedVisits: p.completedVisits
      });
    });

    const ageGroupAnalytics = AGE_GROUPS_ORDER.map(group => ({
      category: group,
      count: ageGroupCounts[group] || 0,
      percentage: totalPatientsAnalyzed > 0 
        ? Number((((ageGroupCounts[group] || 0) / totalPatientsAnalyzed) * 100).toFixed(1))
        : 0,
      patients: ageGroupPatients[group] || []
    }));

    // Gender aggregation
    const genderCounts = { male: 0, female: 0, other: 0, unknown: 0 };
    uniquePatients.forEach(p => {
      const g = (p.gender || '').toLowerCase();
      if (g === 'male') genderCounts.male += 1;
      else if (g === 'female') genderCounts.female += 1;
      else if (g === 'other') genderCounts.other += 1;
      else genderCounts.unknown += 1;
    });

    const genderAnalytics = [
      {
        gender: 'Male',
        count: genderCounts.male,
        percentage: totalPatientsAnalyzed > 0 ? Number(((genderCounts.male / totalPatientsAnalyzed) * 100).toFixed(1)) : 0
      },
      {
        gender: 'Female',
        count: genderCounts.female,
        percentage: totalPatientsAnalyzed > 0 ? Number(((genderCounts.female / totalPatientsAnalyzed) * 100).toFixed(1)) : 0
      },
      {
        gender: 'Other',
        count: genderCounts.other,
        percentage: totalPatientsAnalyzed > 0 ? Number(((genderCounts.other / totalPatientsAnalyzed) * 100).toFixed(1)) : 0
      },
      {
        gender: 'Unknown / Not Specified',
        count: genderCounts.unknown,
        percentage: totalPatientsAnalyzed > 0 ? Number(((genderCounts.unknown / totalPatientsAnalyzed) * 100).toFixed(1)) : 0
      }
    ];

    // Age x Gender Cross Matrix
    const crossAnalysis = AGE_GROUPS_ORDER.map(group => {
      const inGroup = uniquePatients.filter(p => classifyAge(p.age) === group);
      const male = inGroup.filter(p => p.gender === 'male').length;
      const female = inGroup.filter(p => p.gender === 'female').length;
      const other = inGroup.filter(p => p.gender !== 'male' && p.gender !== 'female').length;
      return {
        category: group,
        total: inGroup.length,
        male,
        female,
        other
      };
    });

    res.json({
      totalPatientsAnalyzed,
      ageGroupAnalytics,
      genderAnalytics,
      crossAnalysis
    });
  } catch (error) {
    console.error('Analytics Demographics Error:', error);
    res.status(500).json({ message: 'Failed to calculate demographic analytics', error: error.message });
  }
};

/**
 * 4. BUSIEST DAYS & PEAK TIME SLOTS (HEATMAP & TRAFFIC ANALYSIS)
 * Uses Visit records for completed clinical visits and Appointment records for scheduled demand.
 */
exports.getRushHours = async (req, res) => {
  try {
    const apptFilter = buildAppointmentQuery(req.query);
    const visitFilter = buildVisitQuery(req.query);

    const [appointments, visits] = await Promise.all([
      Appointment.find(apptFilter).lean(),
      Visit.find(visitFilter).lean()
    ]);

    const dayOfWeekCounts = {
      Monday: { day: 'Monday', completed: 0, scheduled: 0 },
      Tuesday: { day: 'Tuesday', completed: 0, scheduled: 0 },
      Wednesday: { day: 'Wednesday', completed: 0, scheduled: 0 },
      Thursday: { day: 'Thursday', completed: 0, scheduled: 0 },
      Friday: { day: 'Friday', completed: 0, scheduled: 0 },
      Saturday: { day: 'Saturday', completed: 0, scheduled: 0 },
      Sunday: { day: 'Sunday', completed: 0, scheduled: 0 }
    };

    const timeSlotMap = {};
    STANDARD_SLOTS.forEach(slot => {
      timeSlotMap[slot] = { slot, completed: 0, scheduled: 0 };
    });

    const heatmapMatrix = {};
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(d => {
      heatmapMatrix[d] = {};
      STANDARD_SLOTS.forEach(s => {
        heatmapMatrix[d][s] = { day: d, timeSlot: s, completed: 0, scheduled: 0 };
      });
    });

    let totalCompleted = visits.length;
    let maxCellCompleted = 0;

    // Process completed visits using their actual visitDate
    visits.forEach(v => {
      const dateObj = new Date(v.visitDate + 'T00:00:00');
      const dayName = DAYS_OF_WEEK[dateObj.getDay()];
      const normalizedSlot = normalizeTimeSlotDisplay(v.timeSlot);

      if (dayOfWeekCounts[dayName]) {
        dayOfWeekCounts[dayName].completed += 1;
      }

      if (timeSlotMap[normalizedSlot]) {
        timeSlotMap[normalizedSlot].completed += 1;
      }

      if (heatmapMatrix[dayName] && heatmapMatrix[dayName][normalizedSlot]) {
        heatmapMatrix[dayName][normalizedSlot].completed += 1;
        if (heatmapMatrix[dayName][normalizedSlot].completed > maxCellCompleted) {
          maxCellCompleted = heatmapMatrix[dayName][normalizedSlot].completed;
        }
      }
    });

    // Process scheduled appointments for demand insight
    appointments.forEach(app => {
      const dateObj = new Date(app.date + 'T00:00:00');
      const dayName = DAYS_OF_WEEK[dateObj.getDay()];
      const normalizedSlot = normalizeTimeSlotDisplay(app.timeSlot);

      if (app.status === 'confirmed' || app.status === 'pending') {
        if (dayOfWeekCounts[dayName]) dayOfWeekCounts[dayName].scheduled += 1;
        if (timeSlotMap[normalizedSlot]) timeSlotMap[normalizedSlot].scheduled += 1;
        if (heatmapMatrix[dayName] && heatmapMatrix[dayName][normalizedSlot]) {
          heatmapMatrix[dayName][normalizedSlot].scheduled += 1;
        }
      }
    });

    // Flatten heatmap matrix with intensity scale (0.0 to 1.0)
    const heatmapData = [];
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
      STANDARD_SLOTS.forEach(slot => {
        const cell = heatmapMatrix[day][slot];
        const intensity = maxCellCompleted > 0 
          ? Number((cell.completed / maxCellCompleted).toFixed(2)) 
          : 0;
        heatmapData.push({
          ...cell,
          intensity
        });
      });
    });

    // Determine Busiest Day and Busiest Hour
    const sortedDays = Object.values(dayOfWeekCounts).sort((a, b) => b.completed - a.completed);
    const busiestDay = sortedDays[0]?.completed > 0 ? sortedDays[0].day : 'No completed visits yet';

    const sortedSlots = Object.values(timeSlotMap).sort((a, b) => b.completed - a.completed);
    const busiestSlot = sortedSlots[0]?.completed > 0 ? sortedSlots[0].slot : 'No completed visits yet';

    // Unique active working days in period
    const activeDates = new Set(visits.map(v => v.visitDate));
    const averageVisitsPerDay = activeDates.size > 0 
      ? Number((totalCompleted / activeDates.size).toFixed(1)) 
      : 0;

    res.json({
      dayOfWeekDistribution: Object.values(dayOfWeekCounts),
      timeSlotDistribution: Object.values(timeSlotMap),
      heatmapData,
      peakSummary: {
        busiestDay,
        busiestSlot,
        averageVisitsPerDay,
        totalCompletedVisits: totalCompleted,
        activeDaysCount: activeDates.size
      }
    });
  } catch (error) {
    console.error('Analytics Rush Hours Error:', error);
    res.status(500).json({ message: 'Failed to calculate rush hours analytics', error: error.message });
  }
};

/**
 * 5. SERVICE-WISE ANALYTICS
 */
exports.getServicesAnalytics = async (req, res) => {
  try {
    const visitFilter = buildVisitQuery(req.query);
    const apptFilter = buildAppointmentQuery(req.query);

    const [allServices, visits, appointments] = await Promise.all([
      Service.find().lean(),
      Visit.find(visitFilter).lean(),
      Appointment.find(apptFilter).lean()
    ]);

    const serviceStats = {};

    allServices.forEach(s => {
      serviceStats[s._id.toString()] = {
        serviceId: s._id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        totalAppointments: 0,
        completedVisits: 0,
        cancelledCount: 0,
        uniquePatients: new Set(),
        revenue: 0
      };
    });

    appointments.forEach(app => {
      const sId = app.serviceId ? app.serviceId.toString() : null;
      if (sId && serviceStats[sId]) {
        serviceStats[sId].totalAppointments += 1;
        if (app.status === 'cancelled') {
          serviceStats[sId].cancelledCount += 1;
        }
      }
    });

    let totalCompletedVisitsAll = visits.length;

    visits.forEach(v => {
      const sId = v.serviceId ? v.serviceId.toString() : null;
      if (sId && serviceStats[sId]) {
        serviceStats[sId].completedVisits += 1;
        serviceStats[sId].revenue += (v.fee || serviceStats[sId].price || 0);
        if (v.patientId) serviceStats[sId].uniquePatients.add(v.patientId.toString());
      }
    });

    const results = Object.values(serviceStats).map(s => {
      const percentage = totalCompletedVisitsAll > 0 
        ? Number(((s.completedVisits / totalCompletedVisitsAll) * 100).toFixed(1))
        : 0;

      return {
        serviceId: s.serviceId,
        name: s.name,
        price: s.price,
        duration: s.duration,
        totalAppointments: Math.max(s.totalAppointments, s.completedVisits),
        completedVisits: s.completedVisits,
        uniquePatientsCount: s.uniquePatients.size,
        percentageOfCompletedVisits: percentage,
        revenue: s.revenue,
        cancellationRate: s.totalAppointments > 0 
          ? Number(((s.cancelledCount / s.totalAppointments) * 100).toFixed(1)) 
          : 0
      };
    });

    // Default sort by completed visits descending
    results.sort((a, b) => b.completedVisits - a.completedVisits);

    res.json({
      totalCompletedVisitsAll,
      services: results
    });
  } catch (error) {
    console.error('Analytics Services Error:', error);
    res.status(500).json({ message: 'Failed to calculate services analytics', error: error.message });
  }
};

/**
 * 6. PATIENT RETENTION & RETURNING ANALYSIS
 */
exports.getPatientRetention = async (req, res) => {
  try {
    const visitFilter = buildVisitQuery(req.query);
    const visits = await Visit.find(visitFilter).lean();

    const patientVisitsMap = {};

    visits.forEach(v => {
      if (!v.patientId) return;
      const pId = v.patientId.toString();
      if (!patientVisitsMap[pId]) {
        patientVisitsMap[pId] = 0;
      }
      patientVisitsMap[pId] += 1;
    });

    const totalPatientsWithVisits = Object.keys(patientVisitsMap).length;
    let returningPatientsCount = 0;
    let totalCompletedVisits = visits.length;

    Object.values(patientVisitsMap).forEach(count => {
      if (count > 1) {
        returningPatientsCount += 1;
      }
    });

    const singleVisitPatients = totalPatientsWithVisits - returningPatientsCount;
    const repeatVisitRate = totalPatientsWithVisits > 0 
      ? Number(((returningPatientsCount / totalPatientsWithVisits) * 100).toFixed(1)) 
      : 0;

    const averageVisitsPerPatient = totalPatientsWithVisits > 0 
      ? Number((totalCompletedVisits / totalPatientsWithVisits).toFixed(1)) 
      : 0;

    res.json({
      totalPatientsInPeriod: totalPatientsWithVisits,
      singleVisitPatients,
      returningPatientsCount,
      repeatVisitRate,
      averageVisitsPerPatient,
      totalCompletedVisits
    });
  } catch (error) {
    console.error('Analytics Retention Error:', error);
    res.status(500).json({ message: 'Failed to calculate patient retention', error: error.message });
  }
};

/**
 * 7. INDIVIDUAL PATIENT VISIT HISTORY (FOR CLINICAL PROFILE & DRILL-DOWN MODAL)
 */
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId).lean();
    if (!patient) {
      return res.status(404).json({ message: 'Patient record not found' });
    }

    const [appointments, visits] = await Promise.all([
      Appointment.find({ patientId })
        .populate('doctorId', 'name specialization')
        .populate('serviceId', 'name price duration')
        .sort({ date: -1, timeSlot: -1 })
        .lean(),
      Visit.find({ patientId })
        .populate('doctorId', 'name specialization')
        .populate('serviceId', 'name price duration')
        .sort({ visitDate: -1, createdAt: -1 })
        .lean()
    ]);

    let completedCount = 0;
    let cancelledCount = 0;
    let noShowCount = 0;
    const serviceCounts = {};

    visits.forEach(v => {
      if (v.status === 'completed') completedCount += 1;
      else if (v.status === 'cancelled') cancelledCount += 1;

      if (v.serviceId?.name) {
        serviceCounts[v.serviceId.name] = (serviceCounts[v.serviceId.name] || 0) + 1;
      }
    });

    appointments.forEach(app => {
      if (app.status === 'no-show') noShowCount += 1;
    });

    res.json({
      patient: {
        _id: patient._id,
        patientId: patient.patientId || '',
        name: patient.name,
        email: patient.email && !patient.email.endsWith('@clinic.local') ? patient.email : '',
        phone: patient.phone || '',
        phoneNormalized: patient.phoneNormalized || '',
        address: patient.address || '',
        age: patient.age,
        gender: patient.gender,
        totalVisits: patient.totalVisits !== undefined ? patient.totalVisits : completedCount,
        firstVisitDate: patient.firstVisitDate || (visits[visits.length - 1]?.visitDate) || null,
        lastVisitDate: patient.lastVisitDate || (visits[0]?.visitDate) || null,
        registeredAt: patient.registrationDate || patient.createdAt
      },
      summary: {
        totalAppointments: appointments.length,
        completedVisits: completedCount,
        cancelledVisits: cancelledCount,
        noShowVisits: noShowCount,
        firstVisitDate: patient.firstVisitDate || (visits[visits.length - 1]?.visitDate) || 'None',
        lastVisitDate: patient.lastVisitDate || (visits[0]?.visitDate) || 'None',
        servicesReceived: serviceCounts
      },
      visits,
      appointments
    });
  } catch (error) {
    console.error('Patient History Error:', error);
    res.status(500).json({ message: 'Failed to retrieve patient history', error: error.message });
  }
};

/**
 * 8. EXPORT FILTERED ANALYTICS REPORT (CSV)
 */
exports.exportCSV = async (req, res) => {
  try {
    const visitFilter = buildVisitQuery(req.query);

    const visits = await Visit.find(visitFilter)
      .populate('patientId', 'patientId name age gender phone address')
      .populate('doctorId', 'name')
      .populate('serviceId', 'name price')
      .sort({ visitDate: -1, createdAt: -1 })
      .lean();

    // Generate CSV Header
    const headers = [
      'Patient ID',
      'Visit Date',
      'Time Slot',
      'Patient Name',
      'Age',
      'Gender',
      'Address',
      'Phone',
      'Doctor Name',
      'Service',
      'Fee (INR)',
      'Status',
      'Payment Status',
      'Notes',
      'Record Created At'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = visits.map(v => [
      escapeCSV(v.patientId?.patientId || ''),
      escapeCSV(v.visitDate),
      escapeCSV(v.timeSlot),
      escapeCSV(v.patientId?.name || 'Anonymous'),
      escapeCSV(v.patientAge || v.patientId?.age || ''),
      escapeCSV(v.patientGender || v.patientId?.gender || ''),
      escapeCSV(v.patientAddress || v.patientId?.address || ''),
      escapeCSV(v.patientId?.phone || ''),
      escapeCSV(v.doctorId?.name ? `Dr. ${v.doctorId.name}` : ''),
      escapeCSV(v.serviceId?.name || 'Consultation'),
      escapeCSV(v.fee || 0),
      escapeCSV(v.status || 'completed'),
      escapeCSV(v.paymentStatus || 'paid'),
      escapeCSV(v.notes || ''),
      escapeCSV(v.createdAt ? new Date(v.createdAt).toISOString() : '')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=Shree_Ganpati_Clinic_Visits_${getISODateOnly()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV Error:', error);
    res.status(500).json({ message: 'Failed to export CSV report', error: error.message });
  }
};
