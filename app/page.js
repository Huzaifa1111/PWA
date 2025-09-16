'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import ItemCard from '../components/ItemCard';
import SalesForm from '../components/SalesForm';
import { getDailyPrices, addSale } from '../lib/db';

const items = ['corns', 'maize', 'flour'];

export default function Home() {
  const [prices, setPrices] = useState({ corns: 0, maize: 0, flour: 0 });
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
const [currentItem, setCurrentItem] = useState('');
const [currentType, setCurrentType] = useState('');
const [name, setName] = useState('');
const [rate, setRate] = useState('');
const [kilo, setKilo] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function loadPrices() {
      try {
        const { prices: dailyPrices } = await getDailyPrices(today);
        setPrices(dailyPrices);
        setPricesLoaded(true);
        if (Object.values(dailyPrices).every(p => p === 0)) {
          setModalMessage('Warning: Prices are zero. Set prices in Settings first for accurate totals.');
        }
      } catch (err) {
        console.error('Error loading prices:', err);
        setModalMessage('Failed to load prices. Please try again.');
      }
    }
    loadPrices();
  }, []);



  const handleSale = async () => {
  const total = rate * kilo || 0;
  const timestamp = new Date().toISOString();
  const success = await addSale({ date: today, timestamp, name, item: currentItem, rate: parseFloat(rate), kilos: parseFloat(kilo), total, type: currentType });
  setModalMessage(success ? 'Entry added successfully!' : 'Error adding entry. Please try again.');
  if (success) {
    setIsModalOpen(false);
    setName('');
    setRate('');
    setKilo('');
  }
};

  const closeModal = () => setModalMessage('');

  const openModal = (item, type) => {
  setCurrentItem(item);
  setCurrentType(type);
  setRate(type === 'sold' ? prices[item].toString() : '');
  setIsModalOpen(true);
};

  if (!pricesLoaded) return <p className="text-center mt-4">Loading prices...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">POS Sales - {today}</h1>
      {Object.values(prices).every(p => p === 0) && (
        <p className="text-red-500 mb-4">
          Prices not set for today. Go to <a href="/settings" className="underline">Settings</a> to set prices.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {items.map(item => (
          <ItemCard
            key={item}
            name={item}
            price={prices[item]}
onBought={() => openModal(item, 'bought')}
  onSold={() => openModal(item, 'sold')}          />
        ))}
      </div>
    
      {modalMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="mb-4">{modalMessage}</p>
            <button
              onClick={closeModal}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
        
      )}
      {isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-xl font-bold mb-4">{currentType.toUpperCase()} {currentItem}</h2>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="border p-2 w-full mb-2" />
      <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Rate" className="border p-2 w-full mb-2" />
      <input type="number" value={kilo} onChange={(e) => setKilo(e.target.value)} placeholder="Kilo" className="border p-2 w-full mb-2" />
      <p className="mb-4">Total: ${rate * kilo || 0}</p>
      <button onClick={handleSale} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Add to Sale</button>
      <button onClick={() => setIsModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
    </div>
  </div>
)}
    </div>
  );
}