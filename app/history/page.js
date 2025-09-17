'use client';

import { useEffect, useState } from 'react';
import { getSalesHistory } from '../../lib/db';
import { format } from 'date-fns';

export default function History() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await getSalesHistory();
        setSales(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (error) {
        console.error('Error loading sales:', error);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const groupByDateTypeAndItem = () => {
    const grouped = {};
    sales.forEach(sale => {
      if (!grouped[sale.date]) {
        grouped[sale.date] = { sold: { corns: [], maize: [], flour: [] }, bought: { corns: [], maize: [], flour: [] } };
      }
      const type = sale.type || 'sold'; // Handle old data without type, assume 'sold'
      if (sale.item && grouped[sale.date][type][sale.item]) {
        grouped[sale.date][type][sale.item].push(sale);
      }
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const calculateDailyTotal = (entries) => entries.reduce((sum, entry) => sum + (entry.total || 0), 0).toFixed(2);

  const calculateItemTotal = (itemEntries) => itemEntries.reduce((sum, entry) => sum + (entry.total || 0), 0).toFixed(2);

  const groupedSales = groupByDateTypeAndItem();
  const items = ['corns', 'maize', 'flour'];

  const renderTable = (entries) => (
    <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
      <thead className="bg-gray-100">
        <tr>
          <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Name</th>
          <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Rate</th>
          <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Kilos</th>
          <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Total</th>
          <th className="py-3 px-4 border-b text-left text-sm font-medium text-gray-700">Date</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(sale => (
          <tr key={sale.id} className="hover:bg-gray-50">
            <td className="py-3 px-4 border-b text-sm">{sale.name || 'N/A'}</td>
            <td className="py-3 px-4 border-b text-sm">${(sale.rate || 0).toFixed(2)}</td>
            <td className="py-3 px-4 border-b text-sm">{sale.kilos || 0}</td>
            <td className="py-3 px-4 border-b text-sm">${(sale.total || 0).toFixed(2)}</td>
            <td className="py-3 px-4 border-b text-sm">{sale.timestamp ? format(new Date(sale.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sales History</h1>
      {loading ? (
        <p className="text-center text-gray-500">Loading sales history...</p>
      ) : groupedSales.length === 0 ? (
        <p className="text-center text-gray-500">No sales yet. Add sales from the home page.</p>
      ) : (
        groupedSales.map(([date, types]) => (
          <div key={date} className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{format(new Date(date), 'MMMM d, yyyy')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Sold - Total: ${calculateDailyTotal([...types.sold.corns, ...types.sold.maize, ...types.sold.flour])}</h3>
                {items.map(item => (
                  <div key={`sold-${item}`} className="mb-4">
                    <h4 className="text-md font-medium mb-1 capitalize">{item} - Subtotal: ${calculateItemTotal(types.sold[item])}</h4>
                    {types.sold[item].length > 0 ? renderTable(types.sold[item]) : <p className="text-gray-500">No {item} sold.</p>}
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Bought - Total: ${calculateDailyTotal([...types.bought.corns, ...types.bought.maize, ...types.bought.flour])}</h3>
                {items.map(item => (
                  <div key={`bought-${item}`} className="mb-4">
                    <h4 className="text-md font-medium mb-1 capitalize">{item} - Subtotal: ${calculateItemTotal(types.bought[item])}</h4>
                    {types.bought[item].length > 0 ? renderTable(types.bought[item]) : <p className="text-gray-500">No {item} bought.</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}