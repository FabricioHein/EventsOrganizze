// create-master-user.js
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Configuração do Firebase (mesma usada no seu app)
const firebaseConfig = {
  apiKey: "AIzaSyCIzvybojTPGSHJmJyWuRkiD6NbSPRCpqQ",
  authDomain: "eventsorganizze.firebaseapp.com",
  projectId: "eventsorganizze",
  storageBucket: "eventsorganizze.firebasestorage.app",
  messagingSenderId: "822700253419",
  appId: "1:822700253419:web:81f2c283502d6e04fc9eae",
  measurementId: "G-C3MSPT4MG1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createMasterUser() {
  try {
    console.log("🚀 Criando usuário Master...");

    // Dados do usuário master
    const masterEmail = "fabricio.geohein@gmail.com";
    const masterPassword = "Master123!";
    const masterName = "Administrador Master";

    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      masterEmail,
      masterPassword
    );
    const user = userCredential.user;

    console.log("✅ Usuário criado no Firebase Auth:", user.uid);

    // Criar perfil do usuário no Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: masterName,
      role: "master", // IMPORTANTE: Define como master
      riskProfile: "moderate",
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    console.log("✅ Perfil master criado no Firestore");
    console.log("📧 Email:", masterEmail);
    console.log("🔑 Senha:", masterPassword);
    console.log("👑 Role: master");
    console.log("");
    console.log("🎉 Usuário Master criado com sucesso!");
    console.log("");
    console.log("⚠️  IMPORTANTE:");
    console.log("   - Guarde essas credenciais em local seguro");
    console.log("   - Altere a senha após o primeiro login");
    console.log("   - Este usuário tem acesso total ao painel administrativo");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar usuário master:", error.message);

    if (error.code === "auth/email-already-in-use") {
      console.log("");
      console.log("💡 O email já está em uso. Opções:");
      console.log("   1. Use um email diferente");
      console.log("   2. Ou defina manualmente no Firestore:");
      console.log("      - Vá para o Firebase Console");
      console.log('      - Abra a coleção "users"');
      console.log("      - Encontre o usuário desejado");
      console.log('      - Adicione o campo: role = "master"');
    }

    process.exit(1);
  }
}

// Executar o script
createMasterUser();
