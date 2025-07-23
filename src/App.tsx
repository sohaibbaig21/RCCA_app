import { useState, useEffect } from 'react';
import IntroScreen from './components/IntroScreen';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import RCCAForm from './components/RCCAForm';
import RCCAList from './components/RCCAList';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Chatbot from './components/Chatbot';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingRCCA, setEditingRCCA] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? JSON.parse(stored) : false;
  });

  const navigate = useNavigate();

  // Restore user and isAdmin from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedAdmin) setIsAdmin(JSON.parse(storedAdmin));
    setLoadingUser(false); // Done restoring
  }, []);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleIntroComplete = () => {
    navigate('/login');
  };

  const handleLogin = (userData: any, adminStatus: boolean) => {
    setUser(userData);
    setIsAdmin(adminStatus);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAdmin', JSON.stringify(adminStatus));
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setEditingRCCA(null);
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  const handleNewRCCA = () => {
    setEditingRCCA(null);
    navigate('/rcca/new');
  };

  const handleEditRCCA = (rcca: any) => {
    setEditingRCCA(rcca);
    navigate(`/rcca/${rcca._id || rcca.id}/edit`);
  };

  const handleViewRCCAs = () => {
    navigate('/rccas');
  };

  const handleBackToDashboard = () => {
    setEditingRCCA(null);
    // Clear any stored RCCA data
    localStorage.removeItem('editingRCCA');
    navigate('/dashboard');
  };

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className={`App ${darkMode ? 'dark' : ''}`}>
        <Routes>
          <Route path="/" element={<IntroScreen onComplete={handleIntroComplete} onSkip={handleIntroComplete} />} />
          <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />
          <Route path="/dashboard" element={<Dashboard user={user} isAdmin={isAdmin} onLogout={handleLogout} onNewRCCA={handleNewRCCA} onViewRCCAs={handleViewRCCAs} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />} />
          <Route path="/rcca/new" element={<RCCAForm user={user} isAdmin={isAdmin} onBack={handleBackToDashboard} editingRCCA={null} darkMode={darkMode} />} />
          <Route path="/rcca/:id/edit" element={<RCCAForm user={user} isAdmin={isAdmin} onBack={handleBackToDashboard} editingRCCA={editingRCCA} darkMode={darkMode} />} />
          <Route path="/rcca/:id" element={<RCCAForm user={user} isAdmin={isAdmin} onBack={handleBackToDashboard} darkMode={darkMode} />} />
          <Route path="/rccas" element={<RCCAList user={user} isAdmin={isAdmin} onEdit={handleEditRCCA} onBack={handleBackToDashboard} darkMode={darkMode} />} />
          <Route path="/rccas/overdue" element={<RCCAList user={user} isAdmin={isAdmin} onEdit={handleEditRCCA} onBack={handleBackToDashboard} overdueOnly={true} darkMode={darkMode} />} />
        </Routes>
      </div>
      {/* Floating Chatbot Button with custom logo */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-6 right-6 bg-white border border-gray-300 shadow-lg rounded-full w-16 h-16 flex items-center justify-center z-50"
        style={{ padding: 0 }}
        aria-label="Open Chatbot"
      >
        <img 
          src="https://i.ibb.co/VWSn822K/Screenshot-2025-07-23-085357-removebg-preview.png" 
          alt="Chatbot" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            borderRadius: '50%',
            backgroundColor: '#E91E63'
          }} 
        />
      </button>
      {/* Chatbot Panel on right side */}
      {showChatbot && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="fixed top-0 right-0 h-full flex flex-col bg-transparent pointer-events-auto"
            style={{ width: 420, maxWidth: '100vw', zIndex: 100 }}
          >
            <div style={{ position: 'relative', height: '100%' }}>
              <Chatbot onClose={() => setShowChatbot(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;