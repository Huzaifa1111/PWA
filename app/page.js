'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import ItemCard from '../components/ItemCard';
import { getDailyPrices, syncData, addSale } from '../lib/db';

export default function Home() {
  const items = ['corns', 'maize', 'flour'];
  const [prices, setPrices] = useState({ corns: 0, maize: 0, flour: 0 });
  const [today, setToday] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modal, setModal] = useState({ open: false, item: '', type: '' });
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    mun: '',
    kilo: '',
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      try {
        setLoading(true);
        const todayDate = format(new Date(), 'yyyy-MM-dd');
        setToday(todayDate);
        const { prices: savedPrices } = await getDailyPrices(todayDate);
        console.log('Loaded prices:', savedPrices);
        setPrices({
          corns: savedPrices.corns || 0,
          maize: savedPrices.maize || 0,
          flour: savedPrices.flour || 0,
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

  const handleOpenModal = (item, type) => {
    console.log('Opening modal for', item, type);
    setModal({ open: true, item, type });
    setFormData({
      name: '',
      rate: type === 'sold' ? prices[item] : '',
      mun: '',
      kilo: '',
      total: 0
    });
    setModalMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };
    if (name === 'mun' || name === 'kilo') {
      const mun = parseFloat(updatedFormData.mun) || 0;
      const kilo = parseFloat(updatedFormData.kilo) || 0;
      const rate = parseFloat(updatedFormData.rate) || 0;
      const totalKilos = mun * 50 + kilo;
      const total = totalKilos * rate;
      updatedFormData = { ...updatedFormData, total: isNaN(total) ? 0 : total };
    } else if (name === 'rate') {
      const mun = parseFloat(formData.mun) || 0;
      const kilo = parseFloat(formData.kilo) || 0;
      const totalKilos = mun * 50 + kilo;
      const total = totalKilos * parseFloat(value || 0);
      updatedFormData = { ...updatedFormData, total: isNaN(total) ? 0 : total };
    }
    setFormData(updatedFormData);
  };

  const handleAddSale = async () => {
    console.log('Adding sale:', formData, modal);
    const { name, rate, mun, kilo } = formData;
    if (!name || !rate || (!mun && !kilo)) {
      setModalMessage('Please fill out all fields.');
      return;
    }
    const parsedRate = parseFloat(rate);
    const totalKilos = (parseFloat(mun) || 0) * 50 + (parseFloat(kilo) || 0);
    if (parsedRate <= 0 || totalKilos <= 0) {
      setModalMessage('Rate and weight must be greater than 0.');
      return;
    }
    const sale = {
      date: today,
      timestamp: new Date().toISOString(),
      name,
      item: modal.item,
      rate: parsedRate,
      kilos: totalKilos,
      total: totalKilos * parsedRate,
      type: modal.type
    };
    try {
      const success = await addSale(sale);
      if (success) {
        setModalMessage('Entry added successfully!');
        setModal({ open: false, item: '', type: '' });
        setFormData({ name: '', rate: '', mun: '', kilo: '', total: 0 });
      } else {
        setModalMessage('Failed to add entry. Please try again.');
      }
    } catch (err) {
      console.error('Error adding sale:', err);
      setModalMessage(`Failed to add entry: ${navigator.onLine ? err.message : 'Saved offline, will sync when online.'}`);
    }
  };

  const closeModal = () => {
    setModal({ open: false, item: '', type: '' });
    setModalMessage('');
    setFormData({ name: '', rate: '', mun: '', kilo: '', total: 0 });
  };

  return (
    <div className="p-6">
      {loading && <p className="text-gray-500 mb-4">Loading prices...</p>}
      {!loading && (
        <>
          <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ItemCard
                key={item}
                item={item}
                price={prices[item]}
                onBuy={() => handleOpenModal(item, 'bought')}
                onSell={() => handleOpenModal(item, 'sold')}
              />
            ))}
          </div>
          {modal.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">
                  {modal.type === 'bought' ? 'Buy' : 'Sell'} {modal.item.charAt(0).toUpperCase() + modal.item.slice(1)}
                </h2>
                {modalMessage && <p className="text-red-500 mb-4">{modalMessage}</p>}
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Customer Name"
                  className="border p-2 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  name="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.rate}
                  onChange={handleInputChange}
                  placeholder="Rate per kilo"
                  className="border p-2 w-full mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2 mb-4">
                  <input
                    name="mun"
                    type="number"
                    min="0"
                    value={formData.mun}
                    onChange={handleInputChange}
                    placeholder="Mun"
                    className="border p-2 w-1/2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    name="kilo"
                    type="number"
                    min="0"
                    value={formData.kilo}
                    onChange={handleInputChange}
                    placeholder="Kilo"
                    className="border p-2 w-1/2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="mb-4">Total: ${formData.total.toFixed(2)}</p>
                <button
                  onClick={handleAddSale}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full mb-2"
                >
                  Add to Sale
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}