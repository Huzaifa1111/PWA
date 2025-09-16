'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { setDailyPrices, getDailyPrices } from '../../lib/db';

export default function Settings() {
  const [prices, setPrices] = useState({ corns: '', maize: '', flour: '' });
  const [today, setToday] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);



 useEffect(() => {
  async function loadPrices() {
    try {
      setLoading(true);
      const todayDate = format(new Date(), 'yyyy-MM-dd');
      setToday(todayDate);
      const { prices: savedPrices } = await getDailyPrices(todayDate);
      console.log('Loaded prices for Settings:', savedPrices);
      setPrices({
        corns: savedPrices.corns !== undefined ? savedPrices.corns.toString() : '',
        maize: savedPrices.maize !== undefined ? savedPrices.maize.toString() : '',
        flour: savedPrices.flour !== undefined ? savedPrices.flour.toString() : '',
      });
    } catch (err) {
      console.error('Error loading prices:', err);
      setModalMessage('Failed to load prices. Please clear browser data and try again.');
    } finally {
      setLoading(false);
    }
  }
  loadPrices();
}, []);

  const handleChange = (e) => {
    const value = e.target.value;
    const parsed = value ? parseFloat(value) : '';
    if (value && (isNaN(parsed) || parsed < 0)) {
      setError(`Invalid price for ${e.target.name}: must be a non-negative number`);
      return;
    }
    setPrices({ ...prices, [e.target.name]: parsed });
    setError('');
  };

  const handleSubmit = async () => {
    const numericPrices = {
      corns: prices.corns ? parseFloat(prices.corns) : 0,
      maize: prices.maize ? parseFloat(prices.maize) : 0,
      flour: prices.flour ? parseFloat(prices.flour) : 0,
    };
    if (Object.values(numericPrices).some(p => p <= 0)) {
      setError('All prices must be greater than 0.');
      return;
    }
    try {
      await setDailyPrices(today, numericPrices);
      setModalMessage('Prices set successfully!');
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setModalMessage(`Failed to save prices: ${err.message || 'Unknown error'}. Please try again.`);
    }
  };

  const clearPrices = () => {
  setPrices({ corns: '', maize: '', flour: '' });
  setError('');
};

  const closeModal = () => setModalMessage('');

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-lg mx-auto">
      {loading && <p className="text-gray-500 mb-4">Loading prices...</p>}
      <h1 className="text-2xl font-bold mb-4">
        Set Daily Prices {today && `- ${today}`}
      </h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
        <input
          name="corns"
          type="number"
          min="0"
          step="0.01"
          value={prices.corns}
          placeholder="Corns price"
          onChange={handleChange}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="maize"
          type="number"
          min="0"
          step="0.01"
          value={prices.maize}
          placeholder="Maize price"
          onChange={handleChange}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="flour"
          type="number"
          min="0"
          step="0.01"
          value={prices.flour}
          placeholder="Flour price"
          onChange={handleChange}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition w-full"
        >
          Save Prices
        </button>
        <button
  onClick={clearPrices}
  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition w-full mt-2"
>
  Clear Prices
</button>
      </div>
      {modalMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <p className="mb-4 text-center">{modalMessage}</p>
            <button
              onClick={closeModal}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}