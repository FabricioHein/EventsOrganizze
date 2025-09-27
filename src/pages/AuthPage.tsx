import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';
import LanguageSelector from '../components/ui/LanguageSelector';

const AuthPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setMessage(null);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao fazer login com Google. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      await signInWithEmail(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      setLoading(false);
      return;
    }
    
    try {
      await signUpWithEmail(formData.email, formData.password, formData.displayName);
      navigate('/dashboard');
    } catch (error: any) {
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      await resetPassword(formData.email);
      setMessage({ 
        type: 'success', 
        text: 'Email de recuperação enviado! Verifique sua caixa de entrada.' 
      });
    } catch (error: any) {
      let errorMessage = 'Erro ao enviar email de recuperação.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex items-center justify-center p-4">
      {/* Language Selector */}
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      {/* Back to Home */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 text-white hover:text-purple-200 transition-colors flex items-center"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar ao início
      </button>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'signin' && 'Entrar na sua conta'}
              {mode === 'signup' && 'Criar nova conta'}
              {mode === 'reset' && 'Recuperar senha'}
            </h1>
            <p className="text-gray-600">
              {mode === 'signin' && 'Acesse sua conta EventFinance'}
              {mode === 'signup' && 'Comece a organizar seus eventos'}
              {mode === 'reset' && 'Digite seu email para recuperar a senha'}
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle size={20} className="mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Google Sign In */}
          <Button
  onClick={handleGoogleSignIn}
  disabled={loading}
  style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
  className="w-full mb-6 border-2 border-gray-300 hover:!bg-gray-200 hover:border-gray-400 focus:ring-blue-400 focus:ring-2 transition-all duration-200 shadow-md hover:shadow-lg font-medium rounded-lg"
>
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Continuar com Google
</Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={
            mode === 'signin' ? handleEmailSignIn :
            mode === 'signup' ? handleEmailSignUp :
            handlePasswordReset
          }>
            {mode === 'signup' && (
              <div className="mb-4">
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirme sua senha"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? 'Carregando...' : (
                mode === 'signin' ? 'Entrar' :
                mode === 'signup' ? 'Criar conta' :
                'Enviar email de recuperação'
              )}
            </Button>
          </form>

          {/* Mode Switcher */}
          <div className="text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => setMode('reset')}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Esqueci minha senha
                </button>
                <div className="text-gray-600 text-sm">
                  Não tem uma conta?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Criar conta
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-gray-600 text-sm">
                Já tem uma conta?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Fazer login
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <div className="text-gray-600 text-sm">
                Lembrou da senha?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Fazer login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;