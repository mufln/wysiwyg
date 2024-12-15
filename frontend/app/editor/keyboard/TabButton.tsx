import React from 'react';

interface TabButtonProps {
  category: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ category, isActive, onClick }) => {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
        isActive
          ? 'bg-white text-blue-600 border-b-2 border-blue-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      onClick={onClick}
    >
      {category}
    </button>
  );
};

export default TabButton;

