import React, { useState } from 'react';
import { mathFunctions } from './mathFunctions';
import TabButton from './TabButton';
import MathButton from './MathButton';

interface MathKeyboardProps {
  onInsert: (value: string) => void;
}

const MathKeyboard: React.FC<MathKeyboardProps> = ({ onInsert }) => {
  const [activeCategory, setActiveCategory] = useState(mathFunctions[0].category);

  const handleInsert = (value: string) => {
    onInsert(value);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex space-x-2 mb-2 overflow-x-auto">
          {mathFunctions.map((category) => (
            <TabButton
              key={category.category}
              category={category.category}
              isActive={activeCategory === category.category}
              onClick={() => setActiveCategory(category.category)}
            />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {mathFunctions
            .find((category) => category.category === activeCategory)
            ?.functions.map((func) => (
              <MathButton
                key={func.label}
                label={func.label}
                value={func.value}
                onClick={handleInsert}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default MathKeyboard;

