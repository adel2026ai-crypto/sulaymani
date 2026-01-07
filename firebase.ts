
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// قواعد Firestore المطلوبة (انسخها بالكامل إلى القواعد في Firebase Console):
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قاعدة المحتوى: تسمح للكل بالقراءة وللأدمن فقط بالكتابة والحذف
    match /content/{docId} {
      allow read: if true;
      allow write, delete: if request.auth != null && request.auth.token.email == 'adel2026ai@gmail.com';
    }
    // قاعدة الأقسام: تسمح للأدمن بإدارة التصنيفات
    match /categories/{docId} {
      allow read: if true;
      allow write, delete: if request.auth != null && request.auth.token.email == 'adel2026ai@gmail.com';
    }
    // قاعدة الإعدادات العامة
    match /settings/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == 'adel2026ai@gmail.com';
    }
    // قاعدة بيانات المستخدمين (للمفضلة والسجل)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/

const firebaseConfig = {
  apiKey: "AIzaSyAeg5SUC-bvQ5WVJ-kV_p_gOqpt5B-1Exw",
  authDomain: "sulaymani-e92a5.firebaseapp.com",
  projectId: "sulaymani-e92a5",
  storageBucket: "sulaymani-e92a5.firebasestorage.app",
  messagingSenderId: "269678916436",
  appId: "1:269678916436:web:395d4cf640d5bf03f10ec1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// استخدام Long Polling لضمان وصول أوامر الحذف حتى في الشبكات الضعيفة
export const db = initializeFirestore(app, {
  forceLongPolling: true,
});

export default app;
