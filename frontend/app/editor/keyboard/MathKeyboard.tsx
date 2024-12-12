import React, { useState } from 'react';
import { mathFunctions } from './mathFunctions';
import TabButton from './TabButton';
import MathButton from './MathButton';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface MathKeyboardProps {
    onInsert: (value: string) => void;
}

const MathKeyboard: React.FC<MathKeyboardProps> = ({ onInsert }) => {
    const [activeCategory, setActiveCategory] = useState(mathFunctions[0].category);
    const [isVisible, setIsVisible] = useState(true);

    const handleInsert = (value: string) => {
        onInsert(value);
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-300 ease-in-out"
             style={{ transform: isVisible ? 'translateY(0)' : 'translateY(100%)' }}>
            <Button
                onClick={toggleVisibility}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full rounded-t-lg rounded-b-none"
            >
                {isVisible ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
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
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-48 overflow-y-auto">
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

