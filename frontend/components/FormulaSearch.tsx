'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'

const formulas = [
  { id: 1, name: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2', source: 'https://en.wikipedia.org/wiki/Pythagorean_theorem' },
  { id: 2, name: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', source: 'https://en.wikipedia.org/wiki/Quadratic_formula' },
  { id: 3, name: 'Euler\'s Identity', latex: 'e^{i\\pi} + 1 = 0', source: 'https://en.wikipedia.org/wiki/Euler%27s_identity' },
]

export default function FormulaSearch() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFormulas = formulas.filter(formula =>
    formula.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="border rounded-lg p-4 bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-4">Formula Search</h2>
      <div className="relative">
        <input
          type="text"
          placeholder="Search formulas..."
          className="w-full p-2 pl-8 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-2 top-2.5 text-gray-400" size={20} />
      </div>
      <ul className="mt-4 space-y-2">
        {filteredFormulas.map(formula => (
          <li key={formula.id} className="border rounded p-2">
            <h3 className="font-bold">{formula.name}</h3>
            <p className="text-sm text-gray-600">{formula.latex}</p>
            <Link href={formula.source} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
              Source
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

