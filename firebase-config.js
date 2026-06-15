const firebaseConfig = {
    apiKey:            "AIzaSyDos7pOQxJvkA1gIpMxKUSSjzoBd_ZSddY",
    authDomain:        "lista-de-compras-6f97d.firebaseapp.com",
    projectId:         "lista-de-compras-6f97d",
    storageBucket:     "lista-de-compras-6f97d.firebasestorage.app",
    messagingSenderId: "790967160570",
    appId:             "1:790967160570:web:10ecd80cc0167e71cd0343"
};

firebase.initializeApp(firebaseConfig);
// var (não const/let) para ficar acessível globalmente nos outros scripts
var db = firebase.firestore();
