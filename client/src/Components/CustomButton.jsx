import React from 'react';

const CustomButton = ({ text, className, onClick, type = "button" }) => {
  return (
    <button
      type={type}
      className={`px-4 py-2 rounded-md font-semibold transition duration-300 ${className}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default CustomButton;