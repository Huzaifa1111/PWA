import { openDB } from 'idb';

const DB_NAME = 'posDB';
const DB_VERSION = 4; // Incremented to force clean upgrade
const STORES = {
  prices: 'prices', // {date: 'YYYY-MM-DD', prices: {corns: 10, maize: 20, flour: 30}}
  sales: 'sales'    // {id, date, timestamp, customerName, items: [{name, qty, price}], total}
};

async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
        if (oldVersion < 1) {
          if (oldVersion < 4) {
  const tx = transaction.objectStore(STORES.sales);
  if (!tx.indexNames.contains('byType')) {
    tx.createIndex('byType', 'type');
    console.log('Created byType index');
  }
}
          // Create initial stores
          if (!db.objectStoreNames.contains(STORES.prices)) {
            db.createObjectStore(STORES.prices, { keyPath: 'date' });
            console.log('Created prices store');
          }
          if (!db.objectStoreNames.contains(STORES.sales)) {
            const store = db.createObjectStore(STORES.sales, { keyPath: 'id', autoIncrement: true });
            store.createIndex('byDate', 'date');
            console.log('Created sales store with byDate index');
          }
        }
        if (oldVersion < 2) {
          // Add timestamp index to sales store
          const tx = transaction.objectStore(STORES.sales);
          if (!tx.indexNames.contains('byTimestamp')) {
            tx.createIndex('byTimestamp', 'timestamp');
            console.log('Created byTimestamp index');
          }
        }
        // No changes for version 3; just ensures clean upgrade
      },
      blocked() {
        console.error('Database upgrade blocked by open connections');
      },
      blocking() {
        console.warn('Database is being blocked by another version');
      },
      terminated() {
        console.warn('Database connection terminated unexpectedly');
      },
    });
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

export async function getDailyPrices(date) {
  try {
    
    const db = await initDB();
    const result = await db.get(STORES.prices, date);
    console.log(`Fetched prices for ${date}:`, result);
    return result || { prices: { corns: 0, maize: 0, flour: 0 } };
  } catch (error) {
    console.error(`Error fetching prices for ${date}:`, error);
    throw error;
  }
}

export async function setDailyPrices(date, prices) {
  try {
    if (!date || typeof date !== 'string') {
      throw new Error('Invalid date');
    }
    if (!prices || typeof prices !== 'object' || 
        Object.values(prices).some(p => isNaN(p) || p < 0)) {
      throw new Error('Invalid prices: all values must be non-negative numbers');
    }
    const db = await initDB();
    await db.put(STORES.prices, { date, prices });
    console.log(`Saved prices for ${date}:`, prices);
  } catch (error) {
    console.error(`Error saving prices for ${date}:`, error);
    throw error;
  }
}

export async function addSale(sale) {
  // check if all required fields are present
  if (sale.date && sale.timestamp && sale.name && sale.item && sale.rate && sale.kilos && sale.total && sale.type) {
    try {
      const db = await initDB();
      await db.add(STORES.sales, sale);
      console.log('Sale added:', sale);
      return true;
    } catch (error) {
      console.error('Error adding sale:', error);
      return false;
    }
  } else {
    console.error('Missing required sale fields:', sale);
    return false;
  }
}


export async function getSalesHistory() {
  try {
    const db = await initDB();
    const sales = await db.getAll(STORES.sales);
    console.log('Fetched sales history:', sales);
    return sales;
  } catch (error) {
    console.error('Error fetching sales history:', error);
    throw error;
  }
}

export async function getDailySales(date) {
  try {
    const db = await initDB();
    const index = db.transaction(STORES.sales).store.index('byDate');
    const sales = await index.getAll(date);
    console.log(`Fetched sales for ${date}:`, sales);
    return sales;
  } catch (error) {
    console.error(`Error fetching daily sales for ${date}:`, error);
    throw error;
  }
}