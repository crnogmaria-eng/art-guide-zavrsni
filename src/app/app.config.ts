import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { routes } from './app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

const firebaseConfig = {
 apiKey: "AIzaSyBwQY7dFLPTPN5Bx7gAbjNz9RqlnFz4LkY",
  authDomain: "art-guid-new.firebaseapp.com",
  projectId: "art-guid-new",
  storageBucket: "art-guid-new.appspot.com",
  messagingSenderId: "398026777464",
  appId: "1:398026777464:web:404a96f347d4c99401de8d",
  measurementId: "G-S0JF24717F"
};


provideFirebaseApp(() => initializeApp(firebaseConfig)),
provideAuth(() => getAuth()),
provideFirestore(() => getFirestore())

//export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
//};


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()) 
  ]
};
