'use client';

import { useEffect, useState } from 'react';
import { getSalesHistory } from '../../lib/db';

export default function History() {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    async function loadHistory() {
      const history = await getSalesHistory();
      setSales(history);
    }
    loadHistory();
  }, []);

  const calculateDailyTotals = () => {
    const daily = {};
    sales.forEach(sale => {
      if (!daily[sale.date]) daily[sale.date] = 0;
      daily[sale.date] += sale.total;
    });
    return daily;
  };

  const dailyTotals = calculateDailyTotals();

  return (
    <div>
      <h1 className="text-2xl mb-4">Sales History</h1>
      <h2>Daily Totals</h2>
      <ul>
        {Object.entries(dailyTotals).map(([date, total]) => (
          <li key={date}>{date}: ${total}</li>
        ))}
      </ul>
      <h2>All Sales</h2>
      <ul>
        {sales.map(sale => (
          <li key={sale.id}>
            {sale.date} - Total: ${sale.total} - Items: {sale.items.map(i => `${i.name} x${i.qty}`).join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}