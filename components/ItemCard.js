"use client";

import PropTypes from "prop-types";

function ItemCard({ item, price, imageUrl, onBuy, onSell }) {
  return (
    <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-col items-center pb-10">
        <img
          className=" w-24 h-24 mb-3 rounded-full shadow-lg"
          src={imageUrl}
          alt={`${item} image`}
        />
        <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white capitalize">
          {item}
        </h5>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Price: ${Number(price).toFixed(2)}
        </span>
        <div className="flex mt-4 md:mt-6 space-x-2">
          <button
            onClick={onBuy}
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-md font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-teal-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800 md:p-0.5 md:me-2"
          >
            <span className="relative px-12 py-2 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent md:px-12 md:py-2 max-sm:px-4 max-sm:py-2 max-sm:flex-1 max-sm:w-full max-sm:text-center">
              Bought
            </span>
          </button>
          <button
            onClick={onSell}
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-md font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 md:p-0.5 md:me-2"
          >
            <span className="relative px-16 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent md:px-14 md:py-2.5 max-sm:px-4 max-sm:py-2 max-sm:flex-1 max-sm:w-full max-sm:text-center">
              Sold
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

ItemCard.propTypes = {
  item: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  imageUrl: PropTypes.string.isRequired,
  onBuy: PropTypes.func.isRequired,
  onSell: PropTypes.func.isRequired,
};

export default ItemCard;