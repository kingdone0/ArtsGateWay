import React, { useState } from 'react';
import Login from '../Components/Login';
import Register from '../Components/Register'; 
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [activeForm, setActiveForm] = useState('login');
  const navigate = useNavigate();
  return (
 
    <div className="auth-container">
      {activeForm === 'login' ? (
        <Login 
          onSwitch={() => setActiveForm('register')}
          onSuccess={() => navigate('/profile')}
        />
        
      ) : (
        <Register 
          onSwitch={() => setActiveForm('login')}
          onSuccess={() => navigate('/')}
        />
      
      )}
    </div>
    
  );
};

export default LoginPage;
