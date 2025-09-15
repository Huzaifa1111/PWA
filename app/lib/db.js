import { openDB } from 'idb';

const DB_NAME = 'posDB';
const DB_VERSION = 1;
const STORES = {
  prices: 'prices', // {date: 'YYYY-MM-DD', prices: {corns: 10, maize: 20, flour: 30}}
  sales: 'sales'    // Array of {id, date, items: [{name, qty, price}], total}
};

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.prices)) {
        db.createObjectStore(STORES.prices, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(STORES.sales)) {
        const store = db.createObjectStore(STORES.sales, { keyPath: 'id', autoIncrement: true });
        store.createIndex('byDate', 'date');
      }
    },
  });
}

export async function getDailyPrices(date) {
  const db = await initDB();
  return db.get(STORES.prices, date) || { prices: { corns: 0, maize: 0, flour: 0 } };
}

export async function setDailyPrices(date, prices) {
  const db = await initDB();
  await db.put(STORES.prices, { date, prices });
}

export async function addSale(sale) {
  const db = await initDB();
  await db.add(STORES.sales, sale);
}

export async function getSalesHistory() {
  const db = await initDB();
  return db.getAll(STORES.sales);
}

export async function getDailySales(date) {
  const db = await initDB();
  const index = db.transaction(STORES.sales).store.index('byDate');
  return index.getAll(date);
}