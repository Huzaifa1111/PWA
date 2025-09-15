'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import ItemCard from '../components/ItemCard';
import SalesForm from '../components/SalesForm';
import { getDailyPrices, addSale } from '../app/lib/db';

const items = ['corns', 'maize', 'flour'];

export default function Home() {
  const [prices, setPrices] = useState({ corns: 0, maize: 0, flour: 0 });
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function loadPrices() {
      const { prices: dailyPrices } = await getDailyPrices(today);
      setPrices(dailyPrices);
    }
    loadPrices();
  }, []);

  const handleSale = async (cart, total) => {
    await addSale({ date: today, items: cart, total });
    alert('Sale added!');
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">POS Sales - {today}</h1>
      <div className="grid grid-cols-3 gap-4">
        {items.map(item => (
          <ItemCard
            key={item}
            name={item}
            price={prices[item]}
            onAdd={() => addToCart({ name: item, price: prices[item] })}
          />
        ))}
      </div>
      <SalesForm items={items.map(item => ({ name: item, price: prices[item] }))} onSubmit={handleSale} />
    </div>
  );
}