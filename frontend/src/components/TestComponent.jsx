import { useState } from 'react'

export default function TestComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white">Test Component</h1>
      <p className="text-zinc-300 mt-2">This is a test to ensure React is working properly.</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Count: {count}
      </button>
    </div>
  )
}
