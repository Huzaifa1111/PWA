"use client";

import { useEffect, useState } from 'react';
import { getSalesHistory } from '../../lib/db';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

export default function History() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isBoughtOpen, setIsBoughtOpen] = useState(false);
  const [isSoldOpen, setIsSoldOpen] = useState(false);

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
        grouped[sale.date] = { sold: { corns: [], wheat: [], mustard: [] }, bought: { corns: [], wheat: [], mustard: [] } };
      }
      const type = sale.type || 'sold'; // Handle old data without type
      if (sale.item && grouped[sale.date][type][sale.item]) {
        grouped[sale.date][type][sale.item].push(sale);
      }
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const calculateDailyTotal = (entries) => entries.reduce((sum, entry) => sum + (entry.total || 0), 0).toFixed(2);

  const calculateItemTotal = (itemEntries) => itemEntries.reduce((sum, entry) => sum + (entry.total || 0), 0).toFixed(2);

  const groupedSales = groupByDateTypeAndItem();
  const items = ['corns', 'wheat', 'mustard'];

 const renderTable = (entries) => (
  <div className="history-table-container overflow-x-auto">
    <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
      <thead className="bg-gray-100 text-gray-700 text-sm md:text-base">
        <tr>
          <th className="px-4 py-2 text-left">Name</th>
          <th className="px-4 py-2 text-left">Rate</th>
          <th className="px-4 py-2 text-left">Kilos</th>
          <th className="px-4 py-2 text-left">Total</th>
          <th className="px-4 py-2 text-left">Date</th>
        </tr>
      </thead>
    </table>

    {/* Scrollable Body */}
    <div className="max-h-32 overflow-y-auto custom-scrollbar">
      <table className="min-w-full border-t border-gray-200">
        <tbody className="divide-y divide-gray-200 text-sm md:text-base">
          {entries.map((sale) => (
            <tr key={sale.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-2">{sale.name || 'N/A'}</td>
              <td className="px-4 py-2">${(sale.rate || 0).toFixed(2)}</td>
              <td className="px-4 py-2">{sale.kilos || 0}</td>
              <td className="px-4 py-2 font-medium">${(sale.total || 0).toFixed(2)}</td>
              <td className="px-4 py-2 text-gray-500">
                {sale.timestamp ? format(new Date(sale.timestamp), 'MM/dd/yy') : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);



  const renderToggle = () => (
    <div className="radio-inputs">
      {/* All Option */}
      <div className="radio">
        <input
          type="radio"
          name="filter"
          value="all"
          id="filter-all"
          checked={selectedFilter === 'all'}
          onChange={() => {
            setSelectedFilter('all');
            setIsBoughtOpen(false);
            setIsSoldOpen(false);
          }}
        />
        <label htmlFor="filter-all" className="name">All</label>
      </div>

      {/* Bought Dropdown */}
      <div className="dropdown-container">
        <div
          className={`dropdown-toggle ${selectedFilter.startsWith('bought-') ? 'active' : ''}`}
          onClick={() => {
            setIsBoughtOpen(!isBoughtOpen);
            setIsSoldOpen(false);
          }}
        >
          <span>Bought</span>
          <span className={`arrow ${isBoughtOpen ? 'rotate' : ''}`}>▼</span>
        </div>
        {isBoughtOpen && (
          <div className="dropdown-menu">
            {items.map(item => (
              <button
                key={`bought-${item}`}
                className={`dropdown-item ${selectedFilter === `bought-${item}` ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFilter(`bought-${item}`);
                  setIsBoughtOpen(false);
                }}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sold Dropdown */}
      <div className="dropdown-container">
        <div
          className={`dropdown-toggle ${selectedFilter.startsWith('sold-') ? 'active' : ''}`}
          onClick={() => {
            setIsSoldOpen(!isSoldOpen);
            setIsBoughtOpen(false);
          }}
        >
          <span>Sold</span>
          <span className={`arrow ${isSoldOpen ? 'rotate' : ''}`}>▼</span>
        </div>
        {isSoldOpen && (
          <div className="dropdown-menu">
            {items.map(item => (
              <button
                key={`sold-${item}`}
                className={`dropdown-item ${selectedFilter === `sold-${item}` ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFilter(`sold-${item}`);
                  setIsSoldOpen(false);
                }}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) return <p className="text-center text-gray-500">Loading sales history...</p>;
    if (groupedSales.length === 0) return <p className="text-center text-gray-500">No sales yet. Add sales from the home page.</p>;

    return groupedSales.map(([date, types]) => {
      const filterParts = selectedFilter.split('-');
      const filterType = filterParts[0];
      const filterItem = filterParts[1];

      return (
        <div key={date} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{format(new Date(date), 'MMMM d, yyyy')}</h2>
          <div className="space-y-4">
            {(selectedFilter === 'all' || filterType === 'sold') && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Sold {filterItem ? `- ${filterItem.charAt(0).toUpperCase() + filterItem.slice(1)}` : ''} - Total: $
                  {calculateDailyTotal(
                    filterItem ? types.sold[filterItem] || [] : [...types.sold.corns, ...types.sold.wheat, ...types.sold.mustard]
                  )}
                </h3>
                {filterItem && filterType === 'sold' ? (
                  <div className="mb-4">
                    <h4 className="text-md font-medium mb-1 capitalize">{filterItem} - Subtotal: ${calculateItemTotal(types.sold[filterItem] || [])}</h4>
                    {types.sold[filterItem]?.length > 0 ? renderTable(types.sold[filterItem]) : <p className="text-gray-500">No {filterItem} sold.</p>}
                  </div>
                ) : selectedFilter === 'all' || selectedFilter === 'sold' ? (
                  items.map(item => (
                    <div key={`sold-${item}`} className="mb-4">
                      <h4 className="text-md font-medium mb-1 capitalize">{item} - Subtotal: ${calculateItemTotal(types.sold[item])}</h4>
                      {types.sold[item].length > 0 ? renderTable(types.sold[item]) : <p className="text-gray-500">No {item} sold.</p>}
                    </div>
                  ))
                ) : null}
              </div>
            )}
            {(selectedFilter === 'all' || filterType === 'bought') && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Bought {filterItem ? `- ${filterItem.charAt(0).toUpperCase() + filterItem.slice(1)}` : ''} - Total: $
                  {calculateDailyTotal(
                    filterItem ? types.bought[filterItem] || [] : [...types.bought.corns, ...types.bought.wheat, ...types.bought.mustard]
                  )}
                </h3>
                {filterItem && filterType === 'bought' ? (
                  <div className="mb-4">
                    <h4 className="text-md font-medium mb-1 capitalize">{filterItem} - Subtotal: ${calculateItemTotal(types.bought[filterItem] || [])}</h4>
                    {types.bought[filterItem]?.length > 0 ? renderTable(types.bought[filterItem]) : <p className="text-gray-500">No {filterItem} bought.</p>}
                  </div>
                ) : selectedFilter === 'all' || selectedFilter === 'bought' ? (
                  items.map(item => (
                    <div key={`bought-${item}`} className="mb-4">
                      <h4 className="text-md font-medium mb-1 capitalize">{item} - Subtotal: ${calculateItemTotal(types.bought[item])}</h4>
                      {types.bought[item].length > 0 ? renderTable(types.bought[item]) : <p className="text-gray-500">No {item} bought.</p>}
                    </div>
                  ))
                ) : null}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="history-page p-2 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Sales History</h1>
      {renderToggle()}
      {renderContent()}
    </div>
  );
}

History.propTypes = {
  sales: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      rate: PropTypes.number,
      kilos: PropTypes.number,
      total: PropTypes.number,
      timestamp: PropTypes.string,
      date: PropTypes.string,
      type: PropTypes.oneOf(['bought', 'sold']),
      item: PropTypes.oneOf(['corns', 'mustard', 'wheat']),
    })
  ),
};