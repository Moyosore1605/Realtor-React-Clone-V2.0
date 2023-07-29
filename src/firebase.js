// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBusFgXR-2SPSYHS58V_CbfDJt9HvGgIs4",
    authDomain: "realtor-react-clone-2.firebaseapp.com",
    projectId: "realtor-react-clone-2",
    storageBucket: "realtor-react-clone-2.appspot.com",
    messagingSenderId: "482119265980",
    appId: "1:482119265980:web:9a5b70e253f43392f8eab9",
    measurementId: "G-HTEKM6TPGB"
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
// getAnalytics(app);