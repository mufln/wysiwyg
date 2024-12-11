'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import {EditableMathField} from "react-mathquill";

interface EquationEditorProps {
    latex: string
    onChange: (latex: string) => void
}

const EquationEditor: React.FC<EquationEditorProps> = ({latex, onChange}) => {
    return (
        <EditableMathField
            className="peer p-4 h-96 w-full border-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600 rounded-md resize-none"
            placeholder="Введите математическое выражение"
            // value={mathInput}
            latex={latex}
            onChange={(mathField) => {
                onChange(mathField.latex())
            }}
            config={{
                spaceBehavesLikeTab: true,
                leftRightIntoCmdGoes: 'up',
                restrictMismatchedBrackets: true,
                sumStartsWithNEquals: true,
                supSubsRequireOperand: true,
                charsThatBreakOutOfSupSub: '+-=<>',
                autoSubscriptNumerals: true,
                autoCommands: 'pi theta sqrt sum prod alpha beta gamma rho',
                autoOperatorNames: 'sin cos tan',
            }}
        />
    )
}

export default EquationEditor

