// Requiring firebase (as our db)
const { initializeApp } = require('firebase/app');
const { getStorage } = require("firebase/storage");
// Importing our configuration to initialize our app
const config = require('./firebaseStorageConfig');

const firebasedb = initializeApp(config.firebaseConfig);
module.exports = getStorage(firebasedb);