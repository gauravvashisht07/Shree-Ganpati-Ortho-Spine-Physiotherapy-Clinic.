import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

export const useServices = () => {
  const queryClient = useQueryClient();

  const getServices = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/services');
      return data;
    },
  });

  const getServiceById = (id) => useQuery({
    queryKey: ['services', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/services/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const createService = useMutation({
    mutationFn: async (newService) => {
      const { data } = await axiosInstance.post('/services', newService);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const { data } = await axiosInstance.put(`/services/${id}`, updatedData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id) => {
      await axiosInstance.delete(`/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  return { getServices, getServiceById, createService, updateService, deleteService };
};
