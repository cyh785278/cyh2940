// Firebase SDK 초기화 및 내보내기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 사용자가 제공한 실제 파이어베이스 설정값입니다.
const firebaseConfig = {
  apiKey: "AIzaSyB7-t777M3xf1B7w5l_1Qw681MEo83aFkM",
  authDomain: "sadflk-300b5.firebaseapp.com",
  projectId: "sadflk-300b5",
  storageBucket: "sadflk-300b5.firebasestorage.app",
  messagingSenderId: "556932113051",
  appId: "1:556932113051:web:d0f1e456017148e3ea9c3e",
  measurementId: "G-DW8MECD6J8"
};

let app, db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase 초기화 중 오류 발생:", e);
}

export { db, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, arrayUnion };
