'use client';

import { useState } from 'react';

export default function SalesForm({ items, cart, setCart, onSubmit }) {
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');

 

  const calculateTotal = () => {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  };

  const handleSubmit = () => {
    if (!customerName) {
      setError('Please enter customer name.');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty. Add items first.');
      return;
    }
  onSubmit(cart, calculateTotal(), customerName);
setCustomerName('');
setError('');
  };

  return (
    <div className="mt-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Current Sale</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="text"
        placeholder="Customer Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className="border p-2 mb-4 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <ul className="mb-4">
        {cart.map((i, idx) => (
          <li key={idx} className="mb-2">{i.name} x {i.qty} = ${(i.price * i.qty).toFixed(2)}</li>
        ))}
      </ul>
      <p className="font-semibold">Total: ${calculateTotal().toFixed(2)}</p>
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600 transition"
      >
        Complete Sale
      </button>
    </div>
  );
}