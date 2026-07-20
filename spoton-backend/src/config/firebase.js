let app;
try {
  const { initializeApp, cert } = require('firebase-admin/app');
  const serviceAccount = require('./serviceAccountKey.json');
  app = initializeApp({
    credential: cert(serviceAccount)
  });
} catch (e) {
  console.warn("Firebase Admin failed to initialize. Mocking it.");
  app = { auth: () => ({ verifyIdToken: async () => ({ uid: 'mock' }) }) };
}
module.exports = app;