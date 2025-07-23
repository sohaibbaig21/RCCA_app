import React, { useState } from 'react';
import { User, Lock, LogIn, Shield, Star, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { authService } from '../services/api';
import { userService } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

interface LoginScreenProps {
  onLogin: (user: any, isAdmin: boolean) => void;
}

// Tooltip Component with new design
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  return (
    <div className="tooltip-container" style={{ 
      display: 'inline-block', 
      position: 'relative',
      cursor: 'help'
    }}>
      {children}
      <div className="tooltip" style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: '1.4',
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 0.2s, visibility 0.2s',
        zIndex: 1000,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '280px',
        textAlign: 'left',
        wordWrap: 'break-word',
        whiteSpace: 'normal'
      }}>
        {content}
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          border: '4px solid transparent',
          borderTopColor: 'rgba(0, 0, 0, 0.8)'
        }}></div>
      </div>
      <style>{`
        .tooltip-container:hover .tooltip {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
    </div>
  );
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Generate random star positions
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    animationDelay: Math.random() * 5,
    animationDuration: Math.random() * 3 + 2
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prevent employee login if users not uploaded
    if (!isAdminLogin) {
      const hasUploaded = await userService.hasUploadedUsers();
      if (hasUploaded === false) {
        setError('Cannot login. Admin has not uploaded employee excel file');
        setLoading(false);
        return;
      }
    }

    try {
      const result = await authService.validateUser(credentials.id, credentials.password);
      
      if (result.isValid && result.user) {
        // Use the actual user role from the database instead of the toggle
        const actualIsAdmin = result.user.role === 'admin' || result.user.id === 'sohaibbaig29';
        onLogin(result.user, actualIsAdmin);
        // Redirect to intended page if present
        if (location.state && location.state.redirectTo) {
          navigate(location.state.redirectTo);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Invalid credentials. Please check your ID and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!credentials.id.trim()) {
      setError('Please enter your User ID first.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.forgotPassword(credentials.id);
      if (result.success) {
        setShowForgotPasswordModal(true);
        setError('');
      } else {
        setError(result.message || 'Failed to process forgot password request.');
      }
    } catch (err) {
      setError('Failed to process forgot password request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-blue-950 to-blue-900">

 {/* Animated stars background */}
      <div className="absolute inset-0">
        
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.animationDelay}s`,
              animationDuration: `${star.animationDuration}s`
            }}
          />
        ))}
      </div>

      {/* Moving star patterns */}
      <div className="absolute inset-0 opacity-30">
        <Star className="absolute top-20 left-20 w-8 h-8 text-white animate-spin" style={{ animationDuration: '8s' }} />
        <Star className="absolute top-40 right-32 w-6 h-6 text-red-200 animate-spin" style={{ animationDuration: '6s' }} />
        <Star className="absolute bottom-32 left-1/4 w-10 h-10 text-red-100 animate-spin" style={{ animationDuration: '10s' }} />
        <Star className="absolute bottom-20 right-20 w-7 h-7 text-white animate-spin" style={{ animationDuration: '7s' }} />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              {isAdminLogin ? (
                <Shield className="w-8 h-8 text-white" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isAdminLogin ? 'Admin Login' : 'Employee Login'}
            </h2>
            <p className="text-red-100">
              {isAdminLogin ? 'Administrative Access' : 'Access your RCCA dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                User ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300" />
                <input
                  type="text"
                  value={credentials.id}
                  onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Enter your ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3">
                <p className="text-red-100 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-red-200 hover:text-white transition-colors duration-200 text-sm underline disabled:opacity-50"
            >
              Forgot Password?
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsAdminLogin(!isAdminLogin)}
              className="text-red-200 hover:text-white transition-colors duration-200 text-sm underline"
            >
              {isAdminLogin ? 'Switch to Employee Login' : 'Admin Login'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-red-200 text-xs">
              Demo credentials: Any ID from the database with password "sohaibbaig29"
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <HelpCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Forgot Password</h3>
              <p className="text-gray-600 mb-6">
                Please contact your administrator to reset your password. 
                A notification has been sent to the admin about your request.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>User ID:</strong> {credentials.id}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  The administrator will be notified of your password reset request.
                </p>
              </div>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;