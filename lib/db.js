import { openDB as idbOpenDB } from 'idb';

const DB_NAME = 'posDB';
const DB_VERSION = 6; // Incremented to force schema update
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
          console.log('Creating byType index on sales store');
          salesStore.createIndex('byType', 'type');
        }
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('pendingSyncs')) {
            console.log('Creating pendingSyncs store');
            db.createObjectStore('pendingSyncs', { keyPath: 'id', autoIncrement: true });
          }
        }
      },
      blocked() { console.error('Database upgrade blocked by open connections'); },
      blocking() { console.warn('Database connection is blocking a future version'); },
      terminated() { console.warn('Database connection unexpectedly terminated'); }
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

    if (navigator.onLine) {
      try {
        const response = await fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, prices }),
        });
        if (!response.ok) throw new Error('Failed to sync prices');
        console.log('Prices synced to server');
      } catch (err) {
        console.warn('Failed to sync prices to server:', err);
      }
    }
    return true;
  } catch (err) {
    console.error('Error saving prices for', date, ':', err);
    throw err;
  }
}

async function sendSaleToServer(sale) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sale),
  });
  if (!response.ok) throw new Error('Failed to sync sale');
  console.log('Sale synced to server:', sale);
}

export async function addSale(sale) {
  try {
    if (!sale.name || !sale.item || !sale.rate || !sale.kilos || !sale.total || !sale.date || !sale.timestamp || !sale.type) {
      console.error('Invalid sale object:', sale);
      throw new Error('Sale object missing required fields');
    }

    const db = await openDB();
    if (!db.objectStoreNames.contains(STORES.sales) || !db.objectStoreNames.contains(STORES.pendingSyncs)) {
      console.error('Required object stores not found:', { sales: db.objectStoreNames.contains(STORES.sales), pendingSyncs: db.objectStoreNames.contains(STORES.pendingSyncs) });
      throw new Error('Database missing required object stores');
    }

    const tx = db.transaction([STORES.sales, STORES.pendingSyncs], 'readwrite');
    const salesStore = tx.objectStore(STORES.sales);
    const pendingStore = tx.objectStore(STORES.pendingSyncs);
    
    const id = await salesStore.add(sale);
    console.log('Sale added to local sales with ID:', id);

    if (navigator.onLine) {
      try {
        await sendSaleToServer(sale);
      } catch (err) {
        console.warn('Failed to sync sale online, queuing:', err);
        await pendingStore.add(sale);
        console.log('Sale queued in pendingSyncs with ID:', id);
      }
    } else {
      console.log('Offline, queuing sale for sync');
      await pendingStore.add(sale);
      console.log('Sale queued in pendingSyncs with ID:', id);
    }

    await tx.done;
    return true;
  } catch (err) {
    console.error('Error adding sale:', err, { sale });
    throw err;
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
  if (!navigator.onLine) {
    console.log('Offline, skipping sync');
    return false;
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORES.pendingSyncs, 'readwrite');
    const syncStore = tx.objectStore(STORES.pendingSyncs);
    const pendingSyncs = await syncStore.getAll();
    console.log('Processing', pendingSyncs.length, 'pending syncs');

    for (const sync of pendingSyncs) {
      const { id, ...saleData } = sync;
      try {
        await sendSaleToServer(saleData);
        await syncStore.delete(id);
        console.log('Synced and deleted pending sync ID:', id);
      } catch (err) {
        console.warn('Failed to sync pending sale ID:', id, err);
      }
    }

    await tx.done;
    console.log('Sync completed successfully');
    return true;
  } catch (err) {
    console.error('Error syncing data:', err);
    return false;
  }
}