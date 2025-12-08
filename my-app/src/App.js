import React, { useState, useEffect } from "react";

// --- LOCK SCREEN ---
const LockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const storedPin = localStorage.getItem("appPin") || "1234";
    if (pin === storedPin) {
      onUnlock();
    } else {
      setError("❌ Galat PIN!");
      setPin("");
    }
  };

  return (
    <div style={styles.centerBox}>
      <h1>🔒 APP LOCKED</h1>
      <p>Default PIN: 1234</p>
      <input 
        type="password" 
        value={pin} 
        onChange={(e) => setPin(e.target.value)} 
        style={styles.input}
        maxLength={4}
      />
      <button onClick={handleLogin} style={styles.btnRed}>UNLOCK</button>
      {error && <p style={{color:'red'}}>{error}</p>}
    </div>
  );
};

// --- MAIN APP ---
function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [view, setView] = useState("home");
  const [newPin, setNewPin] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Install Prompt pakadna
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    // Notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else {
      alert("App already installed or not supported!");
    }
  };

  const changePass = () => {
    if(newPin.length < 4) return alert("4 digit ka PIN rakho!");
    localStorage.setItem("appPin", newPin);
    alert("✅ Password Changed!");
    setNewPin("");
  }

  if (!isAuth) return <LockScreen onUnlock={() => setIsAuth(true)} />;

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>🚗 ERP</h2>
        <button style={styles.menuBtn} onClick={() => setView("home")}>🏠 Home</button>
        <button style={styles.menuBtn} onClick={() => setView("settings")}>⚙️ Settings</button>
        <button style={{...styles.menuBtn, background:'red'}} onClick={() => setIsAuth(false)}>🔒 Lock</button>
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        {view === "home" && <h1>Welcome to Dashboard 📊</h1>}

        {view === "settings" && (
          <div>
            <h2>Settings</h2>
            <div style={styles.card}>
              <h3>Change PIN</h3>
              <input placeholder="New PIN" value={newPin} onChange={(e)=>setNewPin(e.target.value)} style={styles.input}/>
              <button onClick={changePass} style={styles.btnBlue}>Update</button>
            </div>

            <div style={{...styles.card, marginTop:20}}>
              <h3>Mobile App</h3>
              <button onClick={handleInstall} style={styles.btnGreen}>⬇️ Install App</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  centerBox: { height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#222", color: "white" },
  app: { display: "flex", height: "100vh" },
  sidebar: { width: "200px", background: "#333", color: "white", padding: 20 },
  content: { flex: 1, padding: 20 },
  menuBtn: { display:"block", width:"100%", padding:10, marginBottom:10, cursor:"pointer" },
  input: { padding: 10, fontSize: 18, marginBottom: 10 },
  btnRed: { padding: 10, background: "red", color: "white", border:"none", cursor:"pointer" },
  btnBlue: { padding: 10, background: "blue", color: "white", border:"none", cursor:"pointer" },
  btnGreen: { padding: 10, background: "green", color: "white", border:"none", cursor:"pointer" },
  card: { border: "1px solid #ccc", padding: 20, borderRadius: 10 }
};

export default App;
// Fixing Vercel deployment