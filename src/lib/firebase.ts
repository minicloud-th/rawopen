import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase web configuration is public. OAuth client secrets stay in Worker secrets.
export const firebaseApp = initializeApp({
  apiKey: 'AIzaSyBMrOFSeAkK7NI9FRmjGrmbcvNG7buEU-s',
  authDomain: 'opencraft-oauth.firebaseapp.com',
  projectId: 'opencraft-oauth',
  storageBucket: 'opencraft-oauth.firebasestorage.app',
  messagingSenderId: '480870881751',
  appId: '1:480870881751:web:67845ae3f7a06a603d1392',
  measurementId: 'G-ZZ4THZZM6Y',
});
export const auth = getAuth(firebaseApp);
auth.languageCode = 'th';
