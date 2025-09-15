'use client';

import { useState } from 'react';

export default function SalesForm({ items, onSubmit }) {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    const existing = cart.find(i => i.name === item.name);
    if (existing) {
      existing.qty += 1;
      setCart([...cart]);
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  };

  const handleSubmit = () => {
    onSubmit(cart, calculateTotal());
    setCart([]);
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl">Current Sale</h2>
      <ul>
        {cart.map((i, idx) => (
          <li key={idx}>{i.name} x {i.qty} = ${i.price * i.qty}</li>
        ))}
      </ul>
      <p>Total: ${calculateTotal()}</p>
      <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Complete Sale</button>
    </div>
  );
}