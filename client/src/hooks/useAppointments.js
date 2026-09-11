import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

export const useAppointments = (doctorId = null, filters = {}) => {
  const queryClient = useQueryClient();

  // Fetch for patient role
  const getMyAppointments = useQuery({
    queryKey: ['appointments', 'my'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/appointments/my');
      return data;
    },
    enabled: !doctorId, // Only run if not fetching doctor schedule
  });

  // Fetch for doctor role
  const getDoctorSchedule = useQuery({
    queryKey: ['appointments', 'doctor', doctorId, filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters).toString();
      const { data } = await axiosInstance.get(`/appointments/doctor/${doctorId}?${params}`);
      return data;
    },
    enabled: !!doctorId, // Only run if doctorId is provided
  });

  // Shared cancel/update mutations
  const cancelAppointment = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.put(`/appointments/${id}/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await axiosInstance.patch(`/appointments/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    getMyAppointments,
    getDoctorSchedule,
    cancelAppointment,
    updateStatus,
  };
};
