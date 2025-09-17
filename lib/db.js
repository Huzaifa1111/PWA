import { openDB as idbOpenDB } from 'idb';

const DB_NAME = 'posDB';
const DB_VERSION = 5;
const STORES = {
  prices: 'prices',
  sales: 'sales',
  pendingSyncs: 'pendingSyncs'
};

export async function openDB() {
  try {
    const db = await idbOpenDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        console.log('Upgrading database from version', oldVersion, 'to', DB_VERSION);
        if (oldVersion < 1) {
          console.log('Creating prices store');
          db.createObjectStore(STORES.prices, { keyPath: 'date' });
        }
        if (oldVersion < 2) {
          console.log('Creating sales store');
          const salesStore = db.createObjectStore(STORES.sales, { keyPath: 'id', autoIncrement: true });
          console.log('Creating byDate index on sales store');
          salesStore.createIndex('byDate', 'date');
        }
        if (oldVersion < 4) {
          console.log('Adding byType index to sales store');
          const tx = db.transaction(STORES.sales, 'readwrite');
          const salesStore = tx.objectStore(STORES.sales);
          if (!salesStore.indexNames.contains('byType')) {
            salesStore.createIndex('byType', 'type');
          }
        }
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('pendingSyncs')) {
            db.createObjectStore('pendingSyncs', { keyPath: 'id', autoIncrement: true });
            console.log('Created pendingSyncs store');
          }
        }
      },
      blocked() {
        console.error('Database upgrade blocked by open connections');
      },
      blocking() {
        console.warn('Database connection is blocking a future version');
      },
      terminated() {
        console.warn('Database connection unexpectedly terminated');
      }
    });
    console.log('Database initialized successfully');
    return db;
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

export async function getDailyPrices(date) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.prices, 'readonly');
    const store = tx.objectStore(STORES.prices);
    const prices = await store.get(date);
    console.log('Fetched prices for', date, ':', prices);
    return prices || { date, prices: { corns: 0, maize: 0, flour: 0 } };
  } catch (err) {
    console.error('Error fetching prices for', date, ':', err);
    throw err;
  }
}

export async function setDailyPrices(date, prices) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.prices, 'readwrite');
    const store = tx.objectStore(STORES.prices);
    await store.put({ date, prices });
    console.log('Saved prices for', date, ':', prices);
    await tx.done;
    return true;
  } catch (err) {
    console.error('Error saving prices for', date, ':', err);
    return false;
  }
}

export async function addSale(sale) {
  try {
    const db = await openDB();
    if (navigator.onLine) {
      const tx = db.transaction(STORES.sales, 'readwrite');
      const store = tx.objectStore(STORES.sales);
      const id = await store.add(sale);
      console.log('Sale added with ID:', id);
      await tx.done;
      return true;
    } else {
      const tx = db.transaction(STORES.pendingSyncs, 'readwrite');
      const store = tx.objectStore(STORES.pendingSyncs);
      const id = await store.add(sale);
      console.log('Sale queued in pendingSyncs with ID:', id);
      await tx.done;
      return true;
    }
  } catch (err) {
    console.error('Error adding sale:', err);
    return false;
  }
}

export async function getSalesHistory() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.sales, 'readonly');
    const store = tx.objectStore(STORES.sales);
    const sales = await store.getAll();
    console.log('Fetched sales history:', sales);
    return sales;
  } catch (err) {
    console.error('Error fetching sales history:', err);
    throw err;
  }
}

export async function getPendingSyncs() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.pendingSyncs, 'readonly');
    const store = tx.objectStore(STORES.pendingSyncs);
    const syncs = await store.getAll();
    console.log('Fetched pending syncs:', syncs);
    return syncs;
  } catch (err) {
    console.error('Error fetching pending syncs:', err);
    throw err;
  }
}

export async function syncData() {
  try {
    const db = await openDB();
    const tx = db.transaction([STORES.pendingSyncs, STORES.sales], 'readwrite');
    const syncStore = tx.objectStore(STORES.pendingSyncs);
    const salesStore = tx.objectStore(STORES.sales);
    const pendingSyncs = await syncStore.getAll();
    console.log('Processing', pendingSyncs.length, 'pending syncs');
    for (const sync of pendingSyncs) {
      const { id, ...saleData } = sync;
      await salesStore.add(saleData);
      await syncStore.delete(id);
      console.log('Synced and deleted pending sync ID:', id);
    }
    await tx.done;
    console.log('Sync completed successfully');
    return true;
  } catch (err) {
    console.error('Error syncing data:', err);
    return false;
  }
}