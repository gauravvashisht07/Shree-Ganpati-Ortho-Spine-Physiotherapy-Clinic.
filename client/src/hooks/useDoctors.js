import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

export const useDoctors = () => {
  const queryClient = useQueryClient();

  const getDoctors = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/doctors');
      return data;
    },
  });

  const getDoctorById = (id) => useQuery({
    queryKey: ['doctors', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/doctors/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const createDoctor = useMutation({
    mutationFn: async (newDoctor) => {
      const { data } = await axiosInstance.post('/doctors', newDoctor);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const updateDoctor = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const { data } = await axiosInstance.put(`/doctors/${id}`, updatedData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  const deleteDoctor = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/doctors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });

  return { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor };
};
