import React, { useState } from 'react';
import axios from 'axios';
import logo from "../assets/logo.png"; 
const Register = ({ onSwitch, onSuccess }) => {

  const [formData, setFormData] = useState({
    username:'',
    gender:'' ,
    age: 0,
    email: '',
    password: '', 
    role: '',
  });

  const [error, setError] = useState(null); 
  const [isLoading, setIsLoading] = useState(false); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {

      
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
    
      console.log('Registration successful:', response.data);
  
      if (onSuccess) onSuccess();
      
    } catch (err) {

      if (err.response) {

        setError(err.response.data.message || 'حدث خطأ أثناء التسجيل');
 
        setError('لا يوجد اتصال بالسيرفر');
      } else {

        setError('حدث خطأ أثناء إعداد الطلب');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="place-content-center flex justify-between float-end z-30 relative items-center min-h-screen bg-black w-full">
      <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-8">
        <img 
          src={logo} 
          alt="ArtWay Logo" 
          className=" w-full p-48 animate-pulse"
        />
      </div>
      <div className="relative w-[600px] h-[600px] group mr-[10%]">
        <div className="absolute inset-0 rounded-[30%] border-2 border-white transition-all duration-500 group-hover:border-[6px] group-hover:border-pink-500 group-hover:drop-shadow-[0_0_20px_pink] animate-[linear_2.5s_spin_infinite]" />
        <div className="absolute inset-0 rounded-[40%] border-2 border-white transition-all duration-500 group-hover:border-[6px] group-hover:border-yellow-300 group-hover:drop-shadow-[0_0_20px_yellow] animate-[linear_2s_spin_infinite]" />
        <div className="absolute inset-0 rounded-[50%] border-2 border-white transition-all duration-500 group-hover:border-[6px] group-hover:border-blue-400 group-hover:drop-shadow-[0_0_20px_blue] animate-[linear_3s_spin_infinite]" />

        <form
          onSubmit={handleSubmit}
          className="absolute w-[60%] ml-[20%] flex flex-col items-center gap-5 top-10"
        >
          <h2 className="text-white text-center text-xl font-bold mb-2">إنشاء حساب</h2>
          {error && <div className="text-red-500 text-sm w-full text-center">{error}</div>}
          
          <input 
            type="text" 
            name="username" 
            placeholder="الاسم الثلاثي" 
            value={formData.username}
            onChange={handleChange} 
            className="text-right w-full px-4 py-2 rounded-full bg-transparent border border-white text-white placeholder-white/75" 
            required
          />
          
          <select 
            name="gender" 
            value={formData.gender}
            onChange={handleChange} 
            className="text-right w-full px-4 py-2 rounded-full bg-transparent border border-white text-white placeholder-white/75"
            required
          >
            <option value="" disabled className='bg-black'>اختر الجنس</option>
            <option className='bg-black' value="male">ذكر</option>
            <option className='bg-black' value="female">أنثى</option>
          </select>
          
          <input 
            type="num" 
            name="age" 
            placeholder="العمر" 
            value={formData.age}
            onChange={handleChange} 
            className="text-right w-full px-4 py-2 rounded-full bg-transparent border border-white text-white" 
            required
          />
          
          <input 
            type="email" 
            name="email" 
            placeholder="البريد الإلكتروني" 
            value={formData.email}
            onChange={handleChange} 
            className="text-right w-full px-4 py-2 rounded-full bg-transparent border border-white text-white placeholder-white/75" 
            required
          />
          
          <input 
            type="password" 
            name="password" 
            placeholder="كلمة المرور" 
            value={formData.password}
            onChange={handleChange} 
            className="text-right w-full px-4 py-2 rounded-full bg-transparent border border-white text-white placeholder-white/75" 
            required
          />
          
          <select 
            name="role" 
            value={formData.role}
            onChange={handleChange} 
            className="text-right w-full px-4 py-2 rounded-full bg-transparent border border-white text-white"
            required
          >
            <option value="" disabled className='bg-black'>اختر دورك</option>
            <option className='bg-black' value="user">مشاهد</option>
            <option className='bg-black' value="artist">فنان</option>
          </select>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full px-5 py-3 text-white rounded-full bg-gradient-to-r from-pink-500 to-yellow-300 cursor-pointer border-none disabled:opacity-50"
          >
            {isLoading ? 'جاري التسجيل...' : 'تسجيل'}
          </button>
          
          <div className="flex justify-center w-full px-5 text-white text-sm">
            <button
              type="button"
              onClick={onSwitch}
              className="underline text-pink-400 hover:text-pink-600 flex justify-center"
            >
              لديك حساب؟
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;