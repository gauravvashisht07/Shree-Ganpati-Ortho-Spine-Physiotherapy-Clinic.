import React from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Services() {
  const { getServices } = useServices();
  const { data: services, isLoading, isError } = getServices;

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="py-16 px-6 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <header className="mb-14 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-[#1F8A82]/10 text-[#1F8A82] text-xs font-bold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                Specialized Clinical Programs
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-black text-ink mb-4">How We Help You Move</h1>
              <p className="text-base sm:text-xl text-gray-700 font-body max-w-2xl leading-relaxed">
                Whether you're recovering from a sports injury, chronic spinal discomfort, or seeking post-op rehab, our evidence-based treatments are designed for lasting results.
              </p>
            </header>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-3xl"></div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 bg-white rounded-3xl text-center border border-red-100">
                <p className="text-red-500 font-body font-bold mb-2">Unable to load services right now.</p>
                <p className="text-gray-500 text-sm">Please refresh the page or contact the clinic reception directly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {services?.map((service, index) => {
                  const isFeatured = index === 0;
                  return (
                    <Link 
                      to={`/services/${service._id}`} 
                      key={service._id}
                      className={`block bg-white rounded-3xl p-6 sm:p-8 transition-all hover:-translate-y-1 hover:shadow-lg border-2 ${
                        index % 2 === 0 ? 'border-teal/20 hover:border-teal' : 'border-coral/20 hover:border-coral'
                      } ${isFeatured ? 'md:col-span-2 md:row-span-2 flex flex-col justify-between' : ''}`}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            {isFeatured && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-coral/10 text-coral px-2.5 py-1 rounded-md">
                                Featured Program
                              </span>
                            )}
                          </div>
                          <h2 className={`font-display font-bold text-ink mb-2 ${isFeatured ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>
                            {service.name}
                          </h2>
                          <p className={`text-gray-600 font-body leading-relaxed ${isFeatured ? 'text-base sm:text-lg mb-6' : 'text-sm mb-4'}`}>
                            {service.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex gap-4">
                            <span className="text-sm font-bold text-teal">{service.duration} min</span>
                            <span className="text-sm font-bold text-ink">₹{service.price}</span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center">
                            <span className="text-amber-700 font-bold text-xs">→</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
