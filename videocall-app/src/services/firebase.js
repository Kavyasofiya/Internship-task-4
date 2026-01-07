// /src/services/firebase.js
// This file can be empty or have mock data for now
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    // Mock implementation
    callback(null);
    return () => {};
  }
};

export const db = {
  // Mock database
  collection: () => ({
    add: () => Promise.resolve({ id: 'mock-id' }),
    where: () => this,
    orderBy: () => this,
    get: () => Promise.resolve({ docs: [] })
  })
};

export const googleProvider = {};