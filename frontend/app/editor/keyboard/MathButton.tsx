import React from 'react';

interface MathButtonProps {
  label: string;
  value: string;
  onClick: (value: string) => void;
}

const MathButton: React.FC<MathButtonProps> = ({ label, value, onClick }) => {
  return (
    <button
      className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={() => onClick(value)}
    >
      {label}
    </button>
  );
};

export default MathButton;

