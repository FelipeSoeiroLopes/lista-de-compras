// Gerado por scripts/gerar-cofre.mjs. A configuração do Firebase fica criptografada
// (AES-256-GCM). O cofre do admin abre com login e senha; o do convidado, com a chave do link.
const COFRE_FIREBASE = {
    "iteracoes": 600000,
    "salt": "UPxxjfDlwv3orKxwIcn34g==",
    "iv": "lCC0mW3gzWmtx10x",
    "dados": "HFMIsDR+rld/8rmhnoj+jnHjQ2vIEUxM7y99v2fFYBNNYPYzVWuWWVv6WaUvYmhjP0zhhZJjA2SmixtglhW7keMELZDuLwXzdwRcWsZLHHy055L/+S1D1hIbKkB2Y5y/VXFXeFFNWe+uHgHZsHayyQLLirMo8dHdqewvsDbJcOzYUHi8NstpFBl/LsijaRxS3FIz2NTVyP/qSlY7pkcL1kkO9D6f95xvhEdNJQaB3WeRj/qk50v7WQS70KZcyTOXppPejb/JFDEz0vSah15V3QFmBGwnA8orpw4WOoNXIrsXCitZqCiIzkqyBwjhSmGuKjOmB4JoGSYKv3oI2oqumyPMPy3bfbsMAfuM+d7gWKEbN313emJ1PP7MHNLklP4cRWIpOF7JmdXbhgtC5ijcVK86wfixJCjgd+ox+aKZy2Tnc4KQHm+p1YrTQBNXzujzZAeETz8NO/1vPiULAOIX3yAt6GCPt7zTrXatvhiC0hQRGmZ5tgBUPDkVXYIe"
};

const COFRE_CONVIDADO = {
    "iv": "d4JCyPm4joS3Mg0J",
    "dados": "fXRTV0eY8HEtxH1srh8kEzAgKk6M3J1jxvldkeC39l+jvVKThwvSenH72tud8Dl3ioq8fNBaIh6Twgn4hNRQzvouxc2Aucswrm+JPWQ7ak3sUODH09Trn1Ys1vKbt9wHS9z4VRxpJWIWKm24KkpQdSbTYU4/0hER1I+fnwcW8PX6LQxi+lkAJhumI+Ozejji/Cm+47WeA0eBm4uy5l6wJcDqhsAwqX8RwqMRzsNzzVm4adOCkHaKxRn+resn5XAF/6nm7LDM3tURoHlj5ATKJDmx9uF/Rixl8tn9TSNSMv8m2qc4JwRqbR0DVpDiyyi1Y3jDuSUnvc7cL5W5v1hLm2Tcho7bNgldTQHW22gMYaGBhgS0wEWqNiXRBu4BtkfzJNJDmI6XIR29BoyEpxpkrvA3tg=="
};

// var (não const/let) para ficar acessível globalmente nos outros scripts
var db = null;

function conectarFirebase(config) {
    try {
        firebase.initializeApp(config);
        db = firebase.firestore();
    } catch (err) {
        // Sem internet o SDK não carrega: a lista local continua funcionando
        console.error('Firebase indisponível:', err);
    }
}
