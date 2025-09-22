import React from 'react';
import { Calendar, DollarSign, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import LanguageSelector from '../components/ui/LanguageSelector';

const LandingPage: React.FC = () => {
  const { signInWithGoogle, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>
      
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Calendar size={48} className="text-yellow-400 mr-4" />
            <h1 className="text-5xl font-bold text-white">{t('landing.title')}</h1>
          </div>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed">
            {t('landing.subtitle')}
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300">
            <Users size={40} className="text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t('landing.features.clientManagement.title')}</h3>
            <p className="text-purple-100 text-sm">
              {t('landing.features.clientManagement.description')}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300">
            <Calendar size={40} className="text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t('landing.features.eventPlanning.title')}</h3>
            <p className="text-purple-100 text-sm">
              {t('landing.features.eventPlanning.description')}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300">
            <DollarSign size={40} className="text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t('landing.features.financialControl.title')}</h3>
            <p className="text-purple-100 text-sm">
              {t('landing.features.financialControl.description')}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all duration-300">
            <BarChart3 size={40} className="text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t('landing.features.reportsAnalytics.title')}</h3>
            <p className="text-purple-100 text-sm">
              {t('landing.features.reportsAnalytics.description')}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">{t('landing.readyToStart')}</h2>
            <p className="text-purple-100 mb-6">
              {t('landing.signInMessage')}
            </p>
            <Button
              onClick={handleGoogleSignIn}
              size="lg"
              className="bg-yellow-400 text-purple-900 hover:bg-yellow-300 focus:ring-yellow-400 font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('landing.loginWithGoogle')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;