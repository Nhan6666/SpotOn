// src/config/firebaseSetup.js
const admin = require('firebase-admin');

const serviceAccount = require('./firebaseServiceAccount.json');

// Guard: tránh lỗi "App already exists" khi nodemon hot-reload
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;