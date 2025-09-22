# EventFinance - Sistema de Gestão de Eventos

EventFinance é uma aplicação completa para gestão de eventos e controle financeiro, desenvolvida especialmente para cerimonialistas e empresas de decoração.

## 🚀 Funcionalidades

### 📋 Gestão de Clientes
- Cadastro completo de clientes
- Histórico de eventos por cliente
- Informações de contato organizadas

### 🎉 Gestão de Eventos
- Criação e acompanhamento de eventos
- Diferentes tipos: casamentos, debutantes, aniversários, formaturas
- Status de acompanhamento: planejamento, confirmado, concluído, cancelado
- Upload e gerenciamento de contratos
- Cronograma detalhado com tarefas e marcos
- Sistema de checklist personalizado

### 💰 Controle Financeiro
- Gestão completa de pagamentos
- Parcelamento automático
- Múltiplos métodos de pagamento (PIX, cartão, boleto, dinheiro)
- Relatórios financeiros detalhados
- Acompanhamento de recebimentos e pendências

### 📊 Relatórios e Analytics
- Dashboard com métricas importantes
- Relatórios mensais de receita
- Análise por tipo de evento
- Distribuição por método de pagamento
- Exportação de dados

### 🏢 Gestão de Fornecedores
- Cadastro de fornecedores por categoria
- Associação de fornecedores a eventos
- Controle de custos por fornecedor

### 📄 Sistema de Propostas
- Criação de propostas personalizadas
- Acompanhamento de status (enviada, visualizada, aceita, rejeitada)
- Controle de validade

### 📅 Calendário
- Visualização mensal de eventos
- Organização por status
- Interface intuitiva

### 🌐 Multilíngue
- Suporte a Português, Inglês e Espanhol
- Interface adaptável

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **React Router** - Roteamento
- **React Hook Form** - Gerenciamento de formulários
- **Lucide React** - Ícones
- **Recharts** - Gráficos e visualizações
- **date-fns** - Manipulação de datas
- **i18next** - Internacionalização

### Backend/Database
- **Firebase** - Backend as a Service
  - Authentication (Google OAuth)
  - Firestore (Database NoSQL)
  - Storage (Upload de arquivos)

### Build Tools
- **Vite** - Build tool e dev server
- **ESLint** - Linting
- **PostCSS** - Processamento CSS

## 🏗️ Arquitetura

### Estrutura de Pastas
```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes de interface
│   └── ProtectedRoute.tsx
├── contexts/           # Contextos React
├── hooks/              # Custom hooks
├── i18n/              # Configuração de idiomas
├── lib/               # Configurações de bibliotecas
├── pages/             # Páginas da aplicação
├── services/          # Serviços (Firebase, APIs)
├── types/             # Definições TypeScript
├── utils/             # Utilitários
└── constants/         # Constantes da aplicação
```

### Padrões de Código
- **Componentes Funcionais** com hooks
- **TypeScript** para tipagem forte
- **Context API** para gerenciamento de estado global
- **Custom Hooks** para lógica reutilizável
- **Error Boundaries** para tratamento de erros
- **Loading States** para melhor UX

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Firebase

### Instalação
1. Clone o repositório
```bash
git clone [url-do-repositorio]
cd eventfinance
```

2. Instale as dependências
```bash
npm install
```

3. Configure o Firebase
- Crie um projeto no Firebase Console
- Ative Authentication (Google)
- Ative Firestore Database
- Ative Storage
- Configure as regras de segurança

4. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Configure suas credenciais do Firebase
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
# ... outras configurações
```

5. Execute o projeto
```bash
npm run dev
```

## 📱 Funcionalidades por Plano

### Gratuito
- 1 evento ativo
- Gestão básica de clientes
- Controle de pagamentos
- Suporte por email

### Básico (R$ 49/mês)
- Até 5 eventos ativos
- Gestão completa de clientes
- Cadastro de fornecedores
- Propostas personalizadas

### Profissional (R$ 99/mês)
- Até 20 eventos ativos
- Relatórios financeiros
- Cronograma e checklists
- Upload de contratos
- Calendário avançado

### Premium (R$ 199/mês)
- Eventos ilimitados
- Gestão de equipe
- Relatórios avançados
- API personalizada
- Suporte 24/7

## 🔒 Segurança

- Autenticação via Google OAuth
- Regras de segurança no Firestore
- Validação de dados no frontend e backend
- Controle de acesso por usuário
- Backup automático dos dados

## 🌟 Próximas Funcionalidades

- [ ] Integração com WhatsApp Business
- [ ] Sistema de notificações push
- [ ] App mobile (React Native)
- [ ] Integração com gateways de pagamento
- [ ] Sistema de templates de propostas
- [ ] Relatórios em PDF
- [ ] Integração com Google Calendar
- [ ] Sistema de avaliações de clientes

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: suporte@eventfinance.com.br
- WhatsApp: (11) 99999-9999
- Website: https://eventfinance.com.br

---

Desenvolvido com ❤️ para profissionais de eventos no Brasil.