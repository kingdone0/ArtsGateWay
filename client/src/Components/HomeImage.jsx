import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import home0 from "../assets/home0.jfif";
import home1 from "../assets/home1.jfif"; 
import home2 from "../assets/home2.jfif"; 
import home3 from "../assets/home3.jfif";  
const CustomButton = ({ text, onClick, className }) => (
  <button onClick={onClick} className={className}>
    {text}
  </button>
);
const HomeImage = () => {
  const navigate = useNavigate();
 
  const artworks = [
    {
      id: 1,
      title: "اللوحات الزيتية",
      image: `${home3}`,
    },
    {
      id: 2,
      title: "النحت المعاصر",
      image: `${home2}`,
    },
    {
      id: 3,
      title: "التصوير الفوتوغرافي",
      image: `${home1}`,
    }
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/30 z-10" />
        <img 
          src= {home0}

          alt="Art Background"
          className="w-full h-full object-cover animate-kenburns"
        />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold text-white mb-4 text-shadow-lg"
        >
          <span className="text-[#d5006d]">Art</span>Way
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-xl md:text-2xl text-white max-w-2xl mb-8 font-Taj"
        >
          منصة إبداعية تتيح لك اكتشاف ومشاركة أعمالك الفنية مع العالم
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex gap-4"
        >
          <CustomButton 
            text="استكشف الأعمال"
            onClick={() => navigate('/explore')}
            className="bg-[#d5006d] hover:bg-[#b0005a] text-white px-8 py-3 rounded-full text-lg"
          />
          <CustomButton 
            text="انضم إلينا"
            onClick={() => navigate('/auth')}
            className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-3 rounded-full text-lg"
          />
        </motion.div>

        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          {artworks.map((art, index) => (
            <motion.div
              key={art.id}
              whileHover={{ y: -10 }}
              className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 + index * 0.2, duration: 0.6 }}
            >
              <img 
                src={art.image} 
                alt={art.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 text-white">
                <h3 className="font-bold text-lg">{art.title}</h3>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </motion.div>
    </div>
  );
};

export default HomeImage;
