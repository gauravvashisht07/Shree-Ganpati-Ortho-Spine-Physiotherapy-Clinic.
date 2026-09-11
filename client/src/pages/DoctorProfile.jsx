import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDoctors } from '../hooks/useDoctors';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDoctorById } = useDoctors();
  const { data: doctor, isLoading, isError } = getDoctorById(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base py-16 px-8 flex justify-center">
        <div className="w-full max-w-4xl h-96 bg-gray-200 animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <div className="min-h-screen bg-base py-16 px-8 text-center flex flex-col justify-center items-center">
        <p className="text-red-500 font-body mb-4 font-bold text-lg">Doctor profile not found.</p>
        <button onClick={() => navigate('/')} className="text-teal underline font-bold">Back to home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="py-16 px-6 lg:px-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              
              {/* Photo Column */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="aspect-square bg-gray-200 rounded-3xl overflow-hidden mb-6 shadow-sm border border-gray-100">
                  {doctor.photoUrl ? (
                    <img src={doctor.photoUrl} alt={`Dr. ${doctor.name}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-teal/10 text-teal flex items-center justify-center font-black text-6xl">
                      {doctor.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => navigate(`/book?doctor=${doctor._id}`)}
                  className="w-full bg-coral text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-[#E55A39] transition-transform hover:-translate-y-1 text-center block shadow-md"
                >
                  Book with Dr. {doctor.name.split(' ')[0]}
                </button>
              </div>

              {/* Info Column */}
              <div className="w-full md:w-2/3">
                <div className="mb-6 flex flex-wrap items-baseline gap-4">
                  <h1 className="text-4xl sm:text-5xl font-display font-bold text-ink tracking-tight">Dr. {doctor.name}</h1>
                  {doctor.qualifications?.map((qual, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                      {qual}
                    </span>
                  ))}
                </div>

                <div className="mb-8">
                  <div className="flex flex-wrap gap-2">
                    {doctor.specialization?.map((spec, idx) => (
                      <span 
                        key={idx} 
                        className={`font-bold text-sm px-4 py-1.5 rounded-full ${
                          idx % 2 === 0 ? 'bg-teal text-white' : 'bg-coral text-white'
                        }`}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="prose prose-lg mb-12">
                  <p className="text-gray-700 font-body leading-relaxed text-lg">
                    {doctor.bio || `Dr. ${doctor.name} is a senior physiotherapist at Shree Ganpati Ortho & Spine Physiotherapy Clinic, specializing in restorative musculoskeletal treatments and personalized rehabilitation programs.`}
                  </p>
                </div>

                {/* Approach to Care Block */}
                <div className="bg-teal p-8 md:p-10 rounded-3xl mt-8 relative overflow-hidden shadow-sm">
                  <div className="relative z-10">
                    <p className="font-display italic text-xl md:text-2xl text-white font-bold leading-snug">
                      "My philosophy of care is working collaboratively with each patient, combining innovative training with hands-on therapy to restore optimal movement and build resilience."
                    </p>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
