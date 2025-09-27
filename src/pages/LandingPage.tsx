import React from 'react';
import {
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  CheckCircle,
  Star,
  Shield,
  Clock,
  FileText,
  Truck,
  CreditCard,
  Zap,
  Globe,
  ArrowRight,
  Play,
  Mail
} from 'lucide-react';
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
      // Redirect based on user role
      if (user.role === 'master') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const features = [
    {
      icon: <BarChart3 size={32} />,
      title: 'Dashboard Inteligente',
      description: 'Visão geral completa com indicadores de performance, receitas e próximos eventos em tempo real.'
    },
    {
      icon: <Users size={32} />,
      title: 'Gestão de Clientes',
      description: 'Cadastro completo com histórico, preferências e comunicação integrada via WhatsApp.'
    },
    {
      icon: <Calendar size={32} />,
      title: 'Eventos Completos',
      description: 'Cronogramas, checklists, contratos digitais e documentos organizados por evento.'
    },
    {
      icon: <Clock size={32} />,
      title: 'Calendário Integrado',
      description: 'Visualização temporal de todos os eventos com lembretes e notificações automáticas.'
    },
    {
      icon: <FileText size={32} />,
      title: 'Propostas Inteligentes',
      description: 'Envio por e-mail/WhatsApp com rastreamento de abertura e aceite digital.'
    },
    {
      icon: <Truck size={32} />,
      title: 'Rede de Fornecedores',
      description: 'Cadastro e vínculo automático com eventos, controle de custos e avaliações.'
    },
    {
      icon: <DollarSign size={32} />,
      title: 'Controle Financeiro',
      description: 'Receitas, despesas, parcelamentos e relatórios completos com análise de lucratividade.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Segurança Total',
      description: 'Login seguro com Google, criptografia de dados e backup automático na nuvem.'
    }
  ];

  const plans = [
    {
      name: 'Teste Gratuito',
      price: 'Grátis',
      period: '7 dias',
      description: 'Acesso total a todos os módulos',
      features: [
        'Dashboard completo',
        'Gestão de clientes',
        'Eventos ilimitados',
        'Propostas e contratos',
        'Relatórios básicos',
        'Suporte por email'
      ],
      cta: 'Começar Grátis',
      highlight: false,
      color: 'gray'
    },
    {
      name: 'Plano Profissional',
      price: 'R$ 99',
      period: '/mês',
      description: 'Ideal para pequenas empresas',
      features: [
        'Tudo do teste gratuito',
        'Calendário integrado',
        'Fornecedores ilimitados',
        'Controle financeiro completo',
        'Relatórios avançados',
        'Suporte prioritário',
        'Backup automático'
      ],
      cta: 'Assinar agora',
      highlight: true,
      color: 'purple'
    },
    {
      name: 'Plano Premium',
      price: 'R$ 149',
      period: '/mês',
      description: 'Para empresas em crescimento',
      features: [
        'Tudo do plano anterior',
        'Automações avançadas',
        'Integrações externas',
        'API personalizada',
        'Múltiplos usuários',
        'Relatórios personalizados',
        'Suporte 24/7',
        'Gerente de conta'
      ],
      cta: 'Assinar agora',
      highlight: false,
      color: 'blue'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Cerimonialista',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      text: 'Revolucionou minha empresa! Agora consigo organizar 3x mais eventos com muito menos estresse.'
    },
    {
      name: 'João Santos',
      role: 'Decorador de Eventos',
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      text: 'O controle financeiro me ajudou a aumentar a margem de lucro em 40%. Ferramenta indispensável!'
    },
    {
      name: 'Ana Costa',
      role: 'Wedding Planner',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      text: 'Meus clientes adoram receber as propostas pelo WhatsApp. A taxa de conversão dobrou!'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Organize eventos e clientes de forma
                <span className="text-yellow-400"> simples e inteligente</span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-purple-100 leading-relaxed">
                Ferramenta completa para gestão de eventos, finanças e clientes,
                com automações e relatórios detalhados.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400 active:bg-emerald-700 font-bold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-emerald-400 hover:border-emerald-300 rounded-xl"
                >
                  <Play size={24} className="mr-3" />
                  Comece grátis
                </Button>
              </div>
              <p className="text-sm text-purple-200 mt-4">
                ✅ Sem cartão de crédito • ✅ Acesso completo • ✅ Suporte incluído
              </p>
            </div>

            {/* Dashboard Mockup */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                <div className="bg-white rounded-xl p-6 text-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Dashboard</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-green-600 text-sm font-medium">Receita Mensal</div>
                      <div className="text-green-800 text-xl font-bold">R$ 45.280</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-blue-600 text-sm font-medium">Eventos Ativos</div>
                      <div className="text-blue-800 text-xl font-bold">12</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Casamento Maria & João</span>
                      <span className="text-green-600 font-medium">15/02</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Aniversário Ana (15 anos)</span>
                      <span className="text-blue-600 font-medium">22/02</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos que fazem a diferença
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tudo que você precisa para gerenciar seus eventos de forma profissional,
              em uma única plataforma integrada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="text-purple-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planos que crescem com seu negócio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal e comece a transformar sua gestão de eventos hoje mesmo.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div key={index} className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${plan.highlight
                  ? 'border-purple-500 scale-105 ring-4 ring-purple-100'
                  : 'border-gray-200 hover:border-purple-300'
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      ⭐ Mais Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => navigate('/auth')}
                    className={`w-full py-3 text-lg font-semibold ${plan.highlight
                        ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {plan.cta}
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              💳 Pagamento seguro via Asaas • 🔒 Dados protegidos • ❌ Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600">
              Mais de 1.000 profissionais já transformaram seus negócios
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Comece hoje e transforme sua gestão de eventos
          </h2>
          <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
            Junte-se a milhares de profissionais que já descobriram uma forma mais inteligente
            de gerenciar seus eventos e clientes.
          </p>
           <Button
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400 active:bg-emerald-700 font-bold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-emerald-400 hover:border-emerald-300 rounded-xl"
                >
                  <Play size={24} className="mr-3" />
                  Comece grátis
                </Button>
          <p className="text-sm text-purple-200 mt-6">
            Sem compromisso • Sem cartão de crédito • Suporte incluído
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Calendar size={32} className="text-purple-400 mr-3" />
                <h3 className="text-xl font-bold">EventFinance</h3>
              </div>
              <p className="text-gray-400 text-sm">
                A plataforma completa para gestão profissional de eventos e clientes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demonstração</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Treinamentos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 EventFinance. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;