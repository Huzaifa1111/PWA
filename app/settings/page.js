'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { setDailyPrices, getDailyPrices, syncData } from '../../lib/db';

export default function Settings() {
  const [prices, setPrices] = useState({ corns: '', mustard: '', wheat: '' });
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
          mustard: savedPrices.mustard !== undefined ? savedPrices.mustard.toString() : '',
          wheat: savedPrices.wheat !== undefined ? savedPrices.wheat.toString() : '',
        });
        try {
          await syncData();
          console.log('Initial sync completed');
        } catch (err) {
          console.warn('Initial sync failed:', err);
          setModalMessage('Failed to sync data. Offline changes will sync when online.');
        }
      } catch (err) {
        console.error('Error loading prices:', err);
        setModalMessage('Failed to load prices. Please clear browser data and try again.');
      } finally {
        setLoading(false);
      }
    }
    loadPrices();
    const handleOnline = async () => {
      try {
        await syncData();
        console.log('Online sync completed');
      } catch (err) {
        console.warn('Online sync failed:', err);
        setModalMessage('Failed to sync data. Offline changes will sync later.');
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
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
      mustard: prices.mustard ? parseFloat(prices.mustard) : 0,
      wheat: prices.wheat ? parseFloat(prices.wheat) : 0,
    };
    if (Object.values(numericPrices).some(p => p <= 0)) {
      setError('All prices must be greater than 0.');
      return;
    }
    try {
      await setDailyPrices(today, numericPrices);
      setModalMessage('Prices set successfully!');
      if (navigator.onLine) {
        try {
          await syncData();
          console.log('Post-save sync completed');
        } catch (err) {
          console.warn('Post-save sync failed:', err);
          setModalMessage('Prices saved, but failed to sync data. Offline changes will sync when online.');
        }
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setModalMessage(`Failed to save prices: ${err.message || 'Unknown error'}. Please clear browser data and try again.`);
    }
  };

  const clearPrices = () => {
    setPrices({ corns: '', mustard: '', wheat: '' });
    setError('');
  };

  const closeModal = () => setModalMessage('');

  return (
    <div className="mt-12 m-4 p-6 px-8 bg-white rounded-lg shadow max-w-lg mx-auto">
      <h1 className="text-gray-700 text-xl font-bold mb-4">
        Set Daily Prices {today && `- ${today}`}
      </h1>
      {loading && <p className="text-gray-500 mb-4">Loading prices...</p>}
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
          className="text-gray-700 border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="mustard"
          type="number"
          min="0"
          step="0.01"
          value={prices.mustard}
          placeholder="Mustard price"
          onChange={handleChange}
          className="text-gray-700 border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="wheat"
          type="number"
          min="0"
          step="0.01"
          value={prices.wheat}
          placeholder="Wheat price"
          onChange={handleChange}
          className="text-gray-700 border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-md font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800 md:p-0.5 md:me-2"
        >
                      <span className="relative px-12 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent md:px-12 md:py-2 max-sm:px-4 max-sm:py-2 max-sm:flex-1 max-sm:w-full max-sm:text-center">

          Save Prices
          </span>
        </button>
        <button
          onClick={clearPrices}
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-md font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 md:p-0.5 md:me-2"
        >
                      <span className="relative px-12 py-2 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent md:px-14 md:py-2.5 max-sm:px-4 max-sm:py-2 max-sm:flex-1 max-sm:w-full max-sm:text-center">

          Clear Prices
          </span>
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