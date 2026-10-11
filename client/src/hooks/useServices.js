import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axiosInstance';

const DEFAULT_SERVICES = [
  {
    _id: 'default-sports-rehab',
    name: 'Sports Injury Rehab',
    description: 'Targeted recovery plans for athletes — from ACL tears to shin splints. We get you back on the field, faster.',
    duration: 45,
    price: 800
  },
  {
    _id: 'default-manual-therapy',
    name: 'Manual Therapy & Mobilization',
    description: 'Hands-on joint mobilisation, myofascial release, and spinal adjustments to restore pain-free movement.',
    duration: 40,
    price: 700
  },
  {
    _id: 'default-postural-correction',
    name: 'Postural Correction & Ergonomics',
    description: 'Desk workers and cervical spine alignment — targeted postural conditioning to fix root strain.',
    duration: 35,
    price: 600
  },
  {
    _id: 'default-dry-needling',
    name: 'Dry Needling & Myofascial Release',
    description: 'Targeted muscular trigger point release to relieve chronic spasm, sciatica, and deep tension.',
    duration: 30,
    price: 650
  },
  {
    _id: 'default-post-op',
    name: 'Post-Operative Orthopedic Rehab',
    description: 'Guided progressive rehabilitation after ligament reconstruction, joint replacement, or spine surgery.',
    duration: 50,
    price: 900
  },
  {
    _id: 'default-electrotherapy',
    name: 'Advanced Electrotherapy & Ultrasound',
    description: 'Non-invasive therapeutic ultrasound and TENS modalities for rapid acute inflammation and tissue repair.',
    duration: 30,
    price: 500
  }
];

export const useServices = () => {
  const queryClient = useQueryClient();

  const getServices = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/services');
      return Array.isArray(data) && data.length > 0 ? data : DEFAULT_SERVICES;
    },
    placeholderData: DEFAULT_SERVICES,
    staleTime: 1000 * 60 * 10, // 10 minutes fresh
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const getServiceById = (id) => useQuery({
    queryKey: ['services', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/services/${id}`);
      return data;
    },
    placeholderData: () => {
      const cached = queryClient.getQueryData(['services']);
      return cached?.find?.(s => s._id === id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
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
