import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';

/**
 * Play a synthesized gentle 2-tone melodic chime using Web Audio API
 * No external audio files or network requests required!
 */
const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: A5 (880 Hz) - brighter pleasant second chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (err) {
    // Audio context may be suspended before user interacts with the page
  }
};

export default function NotificationBell({ onNavigateToAppointments }) {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('clinic_sound_enabled') !== 'false';
  });
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('clinic_read_notifications') || '[]');
    } catch {
      return [];
    }
  });
  const [latestToast, setLatestToast] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const initialLoadRef = useRef(true);
  const knownIdsRef = useRef(new Set());
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for recent notifications every 15 seconds
  const { data: notifications = [] } = useQuery({
    queryKey: ['booking-notifications'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/appointments/notifications');
      return data;
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  // Sound and banner alert when new booking arrives
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    if (initialLoadRef.current) {
      // First load: populate known IDs without chiming
      notifications.forEach((item) => knownIdsRef.current.add(item._id));
      initialLoadRef.current = false;
      return;
    }

    // Detect newly arrived appointments
    const newItems = notifications.filter((item) => !knownIdsRef.current.has(item._id));
    if (newItems.length > 0) {
      newItems.forEach((item) => knownIdsRef.current.add(item._id));

      if (soundEnabled) {
        playNotificationChime();
      }

      // Display floating alert banner for latest booking
      const newest = newItems[0];
      const pName = newest.patientId?.name || newest.patientName || 'A patient';
      const dName = newest.doctorId?.name || 'Clinic';
      setLatestToast({
        id: newest._id,
        patientName: pName,
        doctorName: dName,
        timeSlot: newest.timeSlot,
        date: newest.date,
        service: newest.serviceId?.name || 'Consultation',
      });

      // Try browser push notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('🚨 New Appointment Booked!', {
            body: `${pName} booked with Dr. ${dName} on ${newest.date} at ${newest.timeSlot}`,
            icon: '/LOGO.jpeg',
          });
        } catch {
          // Ignore notification error
        }
      }
    }
  }, [notifications, soundEnabled]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Auto-dismiss floating toast banner after 6 seconds
  useEffect(() => {
    if (latestToast) {
      const t = setTimeout(() => setLatestToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [latestToast]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('clinic_sound_enabled', String(next));
    if (next) playNotificationChime();
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n._id);
    setReadIds(allIds);
    localStorage.setItem('clinic_read_notifications', JSON.stringify(allIds));
  };

  const handleNotificationClick = (item) => {
    if (!readIds.includes(item._id)) {
      const updated = [...readIds, item._id];
      setReadIds(updated);
      localStorage.setItem('clinic_read_notifications', JSON.stringify(updated));
    }
    setIsOpen(false);
    if (onNavigateToAppointments) {
      onNavigateToAppointments(item);
    }
  };

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    try {
      const { data } = await axiosInstance.post('/appointments/test-email');
      alert(`✅ Success: ${data.message}`);
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const openWhatsApp = (e, item) => {
    e.stopPropagation();
    const phone = item.patientId?.phone || item.patientPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const pName = item.patientId?.name || item.patientName || 'Patient';
    const msg = encodeURIComponent(
      `Hello ${pName}, your appointment at Shree Ganpati Ortho & Spine Clinic is confirmed for ${item.date} at ${item.timeSlot} with Dr. ${item.doctorId?.name || ''}. Please contact us if you have any questions!`
    );
    const url = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n._id)).length;

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-teal/10 hover:text-teal text-ink transition-colors flex items-center justify-center cursor-pointer"
        aria-label="Booking Notifications"
        title="Recent Booking Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-coral text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating In-App Toast Banner */}
      {latestToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-white rounded-2xl p-4 shadow-2xl border-2 border-teal animate-[slideIn_0.3s_ease-out] flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xl shrink-0">
            🔔
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider text-teal">New Booking Received</span>
              <button onClick={() => setLatestToast(null)} className="text-xs text-gray-400 hover:text-ink font-bold">✕</button>
            </div>
            <p className="font-bold text-ink text-sm truncate mt-0.5">{latestToast.patientName}</p>
            <p className="text-xs text-gray-600">
              Dr. {latestToast.doctorName} • {latestToast.date} ({latestToast.timeSlot})
            </p>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-[fadeIn_0.2s_ease-out]">
          {/* Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-ink text-base">Booking Alerts</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-coral/10 text-coral font-bold text-xs">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                  soundEnabled ? 'text-teal bg-teal/10' : 'text-gray-400 bg-gray-100'
                }`}
                title={soundEnabled ? 'Chime sound is active' : 'Chime sound is muted'}
              >
                {soundEnabled ? '🔊 Sound on' : '🔇 Muted'}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-gray-500 hover:text-ink font-bold underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                No booking notifications yet.
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !readIds.includes(item._id);
                const pName = item.patientId?.name || item.patientName || 'Patient';
                const dName = item.doctorId?.name || 'Clinic';
                const sName = item.serviceId?.name || 'Consultation';
                const phone = item.patientId?.phone || item.patientPhone;

                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3 ${
                      isUnread ? 'bg-teal/5' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {isUnread ? '●' : '✓'}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-ink text-sm truncate">{pName}</span>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-teal font-semibold truncate">{sName}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>Dr. {dName} • {item.date} at {item.timeSlot}</span>
                      </div>

                      {/* Quick WhatsApp Action */}
                      {phone && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={(e) => openWhatsApp(e, item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366] text-[#1EBE5D] hover:text-white font-bold text-[11px] transition-colors"
                            title="Chat with patient on WhatsApp"
                          >
                            <span>💬</span>
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
            <button
              onClick={handleSendTestEmail}
              disabled={testingEmail}
              className="text-[11px] font-bold text-gray-600 hover:text-teal bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-teal transition-colors disabled:opacity-50"
              title="Send a live test verification email to clinic admin"
            >
              {testingEmail ? '⏳ Sending...' : '📧 Test Live Email'}
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                if (onNavigateToAppointments) onNavigateToAppointments();
              }}
              className="text-xs font-bold text-teal hover:underline"
            >
              Calendar →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

