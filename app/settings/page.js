'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { setDailyPrices } from '../lib/db';

export default function Settings() {
  const [prices, setPrices] = useState({ corns: 0, maize: 0, flour: 0 });
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleChange = (e) => {
    setPrices({ ...prices, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleSubmit = async () => {
    await setDailyPrices(today, prices);
    alert('Prices set for today!');
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Set Daily Prices - {today}</h1>
      <input name="corns" type="number" placeholder="Corns price" onChange={handleChange} className="border p-2 mr-2" />
      <input name="maize" type="number" placeholder="Maize price" onChange={handleChange} className="border p-2 mr-2" />
      <input name="flour" type="number" placeholder="Flour price" onChange={handleChange} className="border p-2 mr-2" />
      <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Save Prices</button>
    </div>
  );
}