import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import logo from "../assets/logo.png";

const Login = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate(); 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/', { replace: true }); 
      } else {
        setError(result.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full place-content-center flex justify-center float-end z-30 relative items-center min-h-screen bg-black">
      <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-8">
        <img src={logo} alt="ArtWay Logo" className="p-48 w-full animate-pulse" />
      </div>
      <div className="relative w-[50%] h-[500px] flex justify-center items-center">
        <div className="relative w-[500px] h-full group">
          <div className="absolute inset-0 rounded-[30%] border-2 border-white transition-all duration-200 group-hover:border-[6px] group-hover:border-pink-500 group-hover:drop-shadow-[0_0_20px_pink] animate-[linear_2s_spin_infinite]" />
          <div className="absolute inset-0 rounded-[40%] border-2 border-white transition-all duration-200 group-hover:border-[6px] group-hover:border-yellow-300 group-hover:drop-shadow-[0_0_20px_yellow] animate-[linear_3s_spin_infinite]" />
          <div className="absolute inset-0 rounded-[50%] border-2 border-white transition-all duration-200 group-hover:border-[6px] group-hover:border-red-300 group-hover:drop-shadow-[0_0_20px_blue] animate-[linear_4s_spin_infinite]" />

          <form onSubmit={handleSubmit} className="absolute w-[60%] ml-[20%] flex flex-col items-center gap-5 top-20">
            <h2 className="text-white text-2xl">تسجيل الدخول</h2>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="text-right w-full px-5 py-3 text-white bg-transparent border-2 border-white rounded-full placeholder-white/75 focus:outline-none hover:border-pink-500"
              required
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="text-right w-full px-5 py-3 text-white bg-transparent border-2 border-white rounded-full placeholder-white/75 focus:outline-none hover:border-yellow-300"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-3 text-white rounded-full bg-gradient-to-r from-pink-500 to-yellow-300 cursor-pointer border-none disabled:opacity-50"
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-center w-full px-5 text-white text-sm">
              <button
                type="button"
                onClick={onSwitch}
                className="underline text-pink-400 hover:text-pink-600"
              >
                ليس لديك حساب؟
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;