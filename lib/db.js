import { openDB } from 'idb';

const DB_NAME = 'posDB';
const DB_VERSION = 4;
const STORES = {
  prices: 'prices', // {date: 'YYYY-MM-DD', prices: {corns: 10, maize: 20, flour: 30}}
  sales: 'sales',   // {id, date, timestamp, name, item, rate, kilos, total, type}
  syncQueue: 'syncQueue' // {id, data, timestamp}
};

async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
        if (oldVersion < 1) {
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
          const tx = transaction.objectStore(STORES.sales);
          if (!tx.indexNames.contains('byTimestamp')) {
            tx.createIndex('byTimestamp', 'timestamp');
            console.log('Created byTimestamp index');
          }
        }
        if (oldVersion < 4) {
          const tx = transaction.objectStore(STORES.sales);
          if (!tx.indexNames.contains('byType')) {
            tx.createIndex('byType', 'type');
            console.log('Created byType index');
          }
        }
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains(STORES.syncQueue)) {
            const store = db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
            console.log('Created syncQueue store');
          }
        }
      },
      blocked() {
        console.error('Database upgrade blocked. Close other tabs or apps.');
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
    if (!date || typeof date !== 'string') {
      throw new Error('Invalid date');
    }
    const db = await initDB();
    const result = await db.get(STORES.prices, date);
    console.log(`Fetched prices for ${date} from DB:`, result || { prices: { corns: 0, maize: 0, flour: 0 } });
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
    // Queue for sync
    await db.add(STORES.syncQueue, { data: { type: 'prices', date, prices }, timestamp: new Date().toISOString() });
    console.log(`Queued prices for sync: ${date}`);
  } catch (error) {
    console.error(`Error saving prices for ${date}:`, error);
    throw error;
  }
}

export async function addSale(sale) {
  try {
    if (!sale.date || !sale.timestamp || !sale.name || !sale.item || !sale.rate || !sale.kilos || !sale.total || !sale.type) {
      throw new Error('Invalid sale data');
    }
    const db = await initDB();
    const id = await db.add(STORES.sales, sale);
    console.log('Sale added to DB:', sale);
    // Queue for sync
    await db.add(STORES.syncQueue, { data: { type: 'sale', ...sale }, timestamp: new Date().toISOString() });
    console.log('Sale queued for sync:', sale);
    return id;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
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
    if (!date || typeof date !== 'string') {
      throw new Error('Invalid date');
    }
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

export async function getPendingSyncs() {
  try {
    const db = await initDB();
    const pending = await db.getAll(STORES.syncQueue);
    console.log('Fetched pending syncs:', pending);
    return pending;
  } catch (error) {
    console.error('Error fetching pending syncs:', error);
    throw error;
  }
}

export async function clearPendingSync(id) {
  try {
    const db = await initDB();
    await db.delete(STORES.syncQueue, id);
    console.log(`Cleared sync queue entry: ${id}`);
  } catch (error) {
    console.error(`Error clearing sync queue entry ${id}:`, error);
    throw error;
  }
}

export async function syncData() {
  try {
    if (navigator.onLine) {
      const pending = await getPendingSyncs();
      if (pending.length === 0) return;
      for (const entry of pending) {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.data),
        });
        if (response.ok) {
          await clearPendingSync(entry.id);
          console.log(`Synced and cleared: ${entry.id}`);
        } else {
          console.warn(`Failed to sync entry ${entry.id}: ${response.status}`);
        }
      }
    } else {
      console.log('Offline: Cannot sync data');
    }
  } catch (error) {
    console.error('Error during sync:', error);
  }
}