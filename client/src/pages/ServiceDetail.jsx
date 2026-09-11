import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getServiceById } = useServices();
  const { data: service, isLoading, isError } = getServiceById(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base py-16 px-8 flex justify-center">
        <div className="w-full max-w-4xl h-96 bg-gray-200 animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  if (isError || !service) {
    return (
      <div className="min-h-screen bg-base py-16 px-8 text-center flex flex-col justify-center items-center">
        <p className="text-red-500 font-body mb-4 font-bold text-lg">Service not found.</p>
        <button onClick={() => navigate('/services')} className="text-teal underline font-bold">Back to services</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="py-16 px-6 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate('/services')} className="text-gray-500 font-bold hover:text-teal mb-8 block transition-colors">
              ← Back to all services
            </button>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-sm border border-gray-100">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-ink mb-6 uppercase tracking-tight">
                {service.name}
              </h1>
              
              <div className="flex gap-6 mb-8 border-b border-gray-100 pb-8">
                <div className="bg-teal/10 px-4 py-2.5 rounded-2xl">
                  <span className="text-teal font-bold uppercase tracking-wider text-xs block mb-1">Duration</span>
                  <span className="text-xl font-display font-bold text-ink">{service.duration} mins</span>
                </div>
                <div className="bg-coral/10 px-4 py-2.5 rounded-2xl">
                  <span className="text-coral font-bold uppercase tracking-wider text-xs block mb-1">Consultation Fee</span>
                  <span className="text-xl font-display font-bold text-ink">₹{service.price}</span>
                </div>
              </div>

              <div className="prose prose-lg mb-12">
                <p className="text-gray-700 font-body leading-relaxed text-lg sm:text-xl">
                  {service.description}
                </p>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-display font-bold text-ink mb-6">What to expect in a session</h2>
                <ul className="space-y-4 font-body text-gray-700">
                  <li className="flex items-start">
                    <span className="text-teal mr-3 mt-1 font-bold">●</span>
                    A comprehensive clinical musculoskeletal assessment to understand your biomechanics.
                  </li>
                  <li className="flex items-start">
                    <span className="text-teal mr-3 mt-1 font-bold">●</span>
                    Personalized treatment plan tailored directly to your pain relief and recovery goals.
                  </li>
                  <li className="flex items-start">
                    <span className="text-teal mr-3 mt-1 font-bold">●</span>
                    Targeted manual therapy, electrotherapy, or joint mobilization techniques.
                  </li>
                  <li className="flex items-start">
                    <span className="text-teal mr-3 mt-1 font-bold">●</span>
                    Supervised therapeutic exercises that you can safely practice at home.
                  </li>
                </ul>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-display font-bold text-ink mb-6">Our Team For This Service</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.doctorIds?.length > 0 ? (
                    service.doctorIds.map(doc => (
                      <div key={doc._id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="w-12 h-12 bg-teal/10 text-teal rounded-full flex items-center justify-center font-bold">
                          {doc.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-ink">Dr. {doc.name}</p>
                          <p className="text-xs text-gray-500">Physiotherapy Specialist</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 font-body italic">Dedicated specialists available upon booking.</p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => navigate(`/book?service=${encodeURIComponent(service.name)}`)}
                className="w-full sm:w-auto bg-coral text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-[#E55A39] transition-transform hover:-translate-y-1 shadow-md"
              >
                Book this service →
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
