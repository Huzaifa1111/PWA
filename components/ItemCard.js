'use client';

import PropTypes from 'prop-types';

function ItemCard({ item, price, onBuy, onSell }) {
  return (
    <div className="border p-4 rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-semibold capitalize">{item}</h2>
      <p className="text-gray-600">Price: ${Number(price).toFixed(2)}</p>
      <div className="mt-4 flex space-x-2">
        <button
          onClick={onBuy}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Bought
        </button>
        <button
          onClick={onSell}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Sold
        </button>
      </div>
    </div>
  );
}

ItemCard.propTypes = {
  item: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  onBuy: PropTypes.func.isRequired,
  onSell: PropTypes.func.isRequired,
};

export default ItemCard;