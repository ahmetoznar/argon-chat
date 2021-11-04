import firebase from "firebase";

var firebaseConfig = {
  apiKey: "AIzaSyCHA6TiMJN_QOAS1Ea07NkWpqg2vC0fGTA",
  authDomain: "argon-main-chatting.firebaseapp.com",
  projectId: "argon-main-chatting",
  storageBucket: "argon-main-chatting.appspot.com",
  messagingSenderId: "711548557800",
  appId: "1:711548557800:web:5108d6d6b9425a42562c5d",
  measurementId: "G-9G8RB621MR",
};

const firebaseApp = !firebase.apps.length
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app();

export const db = firebaseApp.firestore();

export default firebase;
