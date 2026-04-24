import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- STYLES (Internal for quick setup) ---
const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' },
  authBox: { maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' },
  button: { width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  widgetGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' },
  widget: { padding: '20px', border: '1px solid #eee', borderRadius: '15px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userData, setUserData] = useState({ username: '', userId: '' });

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // 1. SIGNUP LOGIC
  const handleSignup = async () => {
    try {
      await axios.post('http://localhost:5000/api/signup', { username, email, password });
      alert("Account created! Please login.");
      setShowSignup(false);
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  // 2. LOGIN LOGIC
  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUserData({ username: res.data.username, userId: res.data.userId });
      setIsLoggedIn(true);
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  // 3. LOGOUT
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  // --- STAGE 1: AUTH SCREEN ---
  if (!isLoggedIn) {
    return (
      <div style={styles.authBox}>
        <h2>{showSignup ? "Create Account" : "Welcome Back"}</h2>
        {showSignup && (
          <input style={styles.input} placeholder="Full Name" onChange={(e) => setUsername(e.target.value)} />
        )}
        <input style={styles.input} placeholder="Email" type="email" onChange={(e) => setEmail(e.target.value)} />
        <input style={styles.input} placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
        
        <button style={styles.button} onClick={showSignup ? handleSignup : handleLogin}>
          {showSignup ? "Register" : "Login"}
        </button>

        <p style={{ marginTop: '15px', fontSize: '14px' }}>
          {showSignup ? "Already have an account?" : "New student?"} 
          <span style={{ color: '#007bff', cursor: 'pointer', marginLeft: '5px' }} onClick={() => setShowSignup(!showSignup)}>
            {showSignup ? "Login here" : "Sign up here"}
          </span>
        </p>
      </div>
    );
  }

  // --- STAGE 2: DASHBOARD SCREEN ---
  return (
    <div style={styles.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Skill Passport: {userData.username} 👋</h1>
        <button onClick={handleLogout} style={{ padding: '5px 15px', borderRadius: '5px', border: '1px solid red', color: 'red', cursor: 'pointer' }}>Logout</button>
      </header>

      <div style={styles.widgetGrid}>
        <Widget title="Personal Profile" fields={["Gender", "Age", "Bio"]} />
        <Widget title="Education" fields={["Degree", "College", "GPA"]} />
        <Widget title="Coding Stats" fields={["GitHub URL", "LeetCode URL"]} />
        <Widget title="Technical Skills" fields={["Languages", "Tools"]} />
        <Widget title="Documents" isUpload={true} />
      </div>
    </div>
  );
}

// --- WIDGET COMPONENT ---
const Widget = ({ title, fields, isUpload, userId }) => {
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cloudLink, setCloudLink] = useState('');

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('userId', userId);
      data.append('title', title);
      data.append('details', JSON.stringify(formData));
      if (file) data.append('certificate', file);

      const res = await axios.post('http://localhost:5000/api/profile', data);
      
      if (res.data.data.certificateUrl) {
        setCloudLink(res.data.data.certificateUrl);
      }
      
      alert(`${title} Details Saved Successfully!`);
    } catch (err) {
      alert("Error saving details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.widget}>
      <h3>{title}</h3>
      {fields && fields.map(field => (
        <input 
          key={field} 
          style={styles.input} 
          placeholder={field} 
          onChange={(e) => handleInputChange(field, e.target.value)}
        />
      ))}
      
      {isUpload && (
        <div style={{ marginTop: '10px' }}>
          <label style={{ fontSize: '12px' }}>Upload Document:</label>
          <input type="file" style={styles.input} onChange={(e) => setFile(e.target.files[0])} />
        </div>
      )}

      <button 
        style={{ ...styles.button, backgroundColor: isSaving ? '#6c757d' : '#28a745', marginTop: '10px' }}
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving to Cloud..." : "Save Changes"}
      </button>

      {cloudLink && (
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          ✅ Document Stored: <a href={cloudLink} target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>View in Cloud</a>
        </div>
      )}
    </div>
  );
};
export default App;