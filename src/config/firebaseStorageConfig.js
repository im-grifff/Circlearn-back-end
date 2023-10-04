// Import fungsi
//import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
// https://firebase.google.com/docs/web/setup#available-libraries

// Konfigurasi Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/*const firebaseConfig = {
  apiKey: "AIzaSyCHWmyp78Jk58c70X-aYQEY1ceH7ci4nsw",
  authDomain: "rundingstorage.firebaseapp.com",
  projectId: "rundingstorage",
  storageBucket: "rundingstorage.appspot.com",
  messagingSenderId: "207377103266",
  appId: "1:207377103266:web:7b8432ed72f25febf1dafb",
  measurementId: "G-MVMCW1J769"
};*/

// Inisalisasi
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

module.exports = {
    firebaseConfig: {
        apiKey: "AIzaSyCHWmyp78Jk58c70X-aYQEY1ceH7ci4nsw",
        authDomain: "rundingstorage.firebaseapp.com",
        projectId: "rundingstorage",
        storageBucket: "rundingstorage.appspot.com",
        messagingSenderId: "207377103266",
        appId: "1:207377103266:web:7b8432ed72f25febf1dafb",
        measurementId: "G-MVMCW1J769"
    }
}