// firebaseConfig.js
// Configuração e inicialização do Firebase.
// Esta configuração é pública (não é uma senha), então é seguro
// mantê-la no repositório.
//
// Usamos initializeFirestore com long polling automático para evitar
// travamentos de conexão quando o usuário está atrás de VPN ou proxy.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBR9FNaNtvusTaEF3x8wlVAutgVBSV6o_M",
  authDomain: "giro-app-96804.firebaseapp.com",
  projectId: "giro-app-96804",
  storageBucket: "giro-app-96804.firebasestorage.app",
  messagingSenderId: "390682822432",
  appId: "1:390682822432:web:6143c8078f5ef5c6543945"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
