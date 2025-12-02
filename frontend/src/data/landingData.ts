// Dados simulados realistas para a Landing Page

// Dados de Receitas vs Despesas (12 meses)
export const monthlyIncomeExpenses = [
  { month: 'Jan', receitas: 8500, despesas: 6200 },
  { month: 'Fev', receitas: 9200, despesas: 6800 },
  { month: 'Mar', receitas: 8800, despesas: 7100 },
  { month: 'Abr', receitas: 9500, despesas: 6900 },
  { month: 'Mai', receitas: 10200, despesas: 7500 },
  { month: 'Jun', receitas: 9800, despesas: 7200 },
  { month: 'Jul', receitas: 11000, despesas: 8100 },
  { month: 'Ago', receitas: 10500, despesas: 7800 },
  { month: 'Set', receitas: 9900, despesas: 7400 },
  { month: 'Out', receitas: 10800, despesas: 7900 },
  { month: 'Nov', receitas: 11500, despesas: 8300 },
  { month: 'Dez', receitas: 12200, despesas: 9100 },
];

// Distribuição por Categoria
export const categoryData = [
  { name: 'Alimentação', value: 2800, color: '#FF6384' },
  { name: 'Moradia', value: 3500, color: '#36A2EB' },
  { name: 'Transporte', value: 1200, color: '#FFCE56' },
  { name: 'Lazer', value: 800, color: '#4BC0C0' },
  { name: 'Saúde', value: 950, color: '#9966FF' },
  { name: 'Educação', value: 1100, color: '#FF9F40' },
  { name: 'Outros', value: 850, color: '#C9CBCF' },
];

// Progresso de Orçamentos
export const budgetProgress = [
  { category: 'Alimentação', budget: 3000, spent: 2800, percentage: 93 },
  { category: 'Moradia', budget: 4000, spent: 3500, percentage: 88 },
  { category: 'Transporte', budget: 1500, spent: 1200, percentage: 80 },
  { category: 'Lazer', budget: 1000, spent: 800, percentage: 80 },
  { category: 'Saúde', budget: 1200, spent: 950, percentage: 79 },
];

// Tendências Mensais (múltiplas linhas)
export const trendData = [
  { month: 'Jan', economia: 2300, investimentos: 1500, reserva: 5000 },
  { month: 'Fev', economia: 2400, investimentos: 1800, reserva: 6800 },
  { month: 'Mar', economia: 1700, investimentos: 1600, reserva: 8100 },
  { month: 'Abr', economia: 2600, investimentos: 2000, reserva: 10100 },
  { month: 'Mai', economia: 2700, investimentos: 2200, reserva: 12600 },
  { month: 'Jun', economia: 2600, investimentos: 2100, reserva: 15100 },
  { month: 'Jul', economia: 2900, investimentos: 2500, reserva: 17900 },
  { month: 'Ago', economia: 2700, investimentos: 2300, reserva: 20400 },
  { month: 'Set', economia: 2500, investimentos: 2100, reserva: 22700 },
  { month: 'Out', economia: 2900, investimentos: 2400, reserva: 25300 },
  { month: 'Nov', economia: 3200, investimentos: 2800, reserva: 28700 },
  { month: 'Dez', economia: 3100, investimentos: 2700, reserva: 31900 },
];

// Features expandidos
export const features = [
  {
    icon: 'Dashboard',
    title: 'Dashboard Intuitivo',
    description: 'Visualize todas as suas contas, receitas e despesas em um único lugar com gráficos interativos e atualizações em tempo real.',
    color: '#7c3aed',
  },
  {
    icon: 'TrendingUp',
    title: 'Análise Inteligente',
    description: 'Acompanhe tendências, identifique padrões de gastos e receba insights personalizados para otimizar suas finanças.',
    color: '#10b981',
  },
  {
    icon: 'Security',
    title: 'Segurança Total',
    description: 'Criptografia de ponta a ponta, autenticação de dois fatores e conformidade com LGPD para proteger seus dados.',
    color: '#ef4444',
  },
  {
    icon: 'Speed',
    title: 'Alta Performance',
    description: 'Interface ultra-rápida e responsiva construída com as tecnologias mais modernas do mercado.',
    color: '#f59e0b',
  },
  {
    icon: 'AccountBalance',
    title: 'Múltiplas Contas',
    description: 'Gerencie contas correntes, poupança, cartões de crédito e investimentos em uma única plataforma.',
    color: '#3b82f6',
  },
  {
    icon: 'Category',
    title: 'Categorização Automática',
    description: 'Sistema inteligente que categoriza suas transações automaticamente, economizando seu tempo.',
    color: '#8b5cf6',
  },
  {
    icon: 'Notifications',
    title: 'Alertas Personalizados',
    description: 'Receba notificações sobre vencimentos, metas alcançadas e gastos acima do orçamento.',
    color: '#ec4899',
  },
  {
    icon: 'Share',
    title: 'Compartilhamento',
    description: 'Compartilhe dashboards com família ou sócios com controles de permissão granulares.',
    color: '#14b8a6',
  },
];

// Como Funciona
export const howItWorksSteps = [
  {
    step: 1,
    title: 'Crie sua Conta',
    description: 'Cadastre-se gratuitamente em menos de 2 minutos. Use e-mail ou login social com Google.',
    icon: 'PersonAdd',
  },
  {
    step: 2,
    title: 'Adicione suas Contas',
    description: 'Registre suas contas bancárias, cartões e investimentos. Tudo em um só lugar.',
    icon: 'AccountBalanceWallet',
  },
  {
    step: 3,
    title: 'Registre Transações',
    description: 'Importe planilhas, adicione manualmente ou conecte suas contas para sincronização automática.',
    icon: 'Receipt',
  },
  {
    step: 4,
    title: 'Visualize e Controle',
    description: 'Acompanhe seus gastos, defina metas, crie orçamentos e tome decisões financeiras inteligentes.',
    icon: 'Insights',
  },
];

// Plataformas
export const platforms = [
  { name: 'Web', icon: 'Language', available: true, description: 'Acesse de qualquer navegador' },
  { name: 'iOS', icon: 'Apple', available: true, description: 'App nativo para iPhone e iPad' },
  { name: 'Android', icon: 'Android', available: true, description: 'Disponível na Google Play' },
  { name: 'Windows', icon: 'DesktopWindows', available: true, description: 'App desktop para Windows' },
  { name: 'macOS', icon: 'Laptop', available: true, description: 'App desktop para Mac' },
  { name: 'Linux', icon: 'Computer', available: true, description: 'Pacotes .deb e .rpm' },
];

// Depoimentos
export const testimonials = [
  {
    name: 'Ana Silva',
    role: 'Empreendedora',
    avatar: 'AS',
    rating: 5,
    text: 'Finalmente consegui organizar as finanças da minha empresa. O Finanças 360° me economiza horas toda semana!',
    color: '#FF6384',
  },
  {
    name: 'Carlos Mendes',
    role: 'Desenvolvedor',
    avatar: 'CM',
    rating: 5,
    text: 'Interface linda e funcional. Como dev, aprecio a atenção aos detalhes e a performance impecável.',
    color: '#36A2EB',
  },
  {
    name: 'Maria Oliveira',
    role: 'Professora',
    avatar: 'MO',
    rating: 5,
    text: 'Nunca imaginei que controlar minhas finanças pudesse ser tão fácil. Recomendo para todos!',
    color: '#FFCE56',
  },
  {
    name: 'João Santos',
    role: 'Investidor',
    avatar: 'JS',
    rating: 5,
    text: 'Acompanhar meus investimentos ficou muito mais simples. Os gráficos são excelentes!',
    color: '#4BC0C0',
  },
  {
    name: 'Beatriz Costa',
    role: 'Designer',
    avatar: 'BC',
    rating: 5,
    text: 'Design impecável! Além de funcional, é uma das apps financeiras mais bonitas que já vi.',
    color: '#9966FF',
  },
];

// Estatísticas
export const statistics = [
  { label: 'Usuários Ativos', value: 50000, suffix: '+', prefix: '' },
  { label: 'Valor Gerenciado', value: 2.5, suffix: 'Bi', prefix: 'R$ ' },
  { label: 'Satisfação', value: 98, suffix: '%', prefix: '' },
  { label: 'Suporte', value: 24, suffix: '/7', prefix: '' },
];

// Recursos de Segurança
export const securityFeatures = [
  {
    icon: 'Lock',
    title: 'Criptografia AES-256',
    description: 'Todos os dados são criptografados em repouso e em trânsito.',
  },
  {
    icon: 'VerifiedUser',
    title: 'Autenticação 2FA',
    description: 'Proteção adicional com autenticação de dois fatores.',
  },
  {
    icon: 'Policy',
    title: 'Conformidade LGPD',
    description: 'Total conformidade com a Lei Geral de Proteção de Dados.',
  },
  {
    icon: 'Backup',
    title: 'Backup Automático',
    description: 'Seus dados são replicados diariamente em múltiplos servidores.',
  },
  {
    icon: 'Shield',
    title: 'Monitoramento 24/7',
    description: 'Sistema de detecção de ameaças em tempo real.',
  },
  {
    icon: 'GppGood',
    title: 'Auditoria Completa',
    description: 'Registro detalhado de todas as ações para sua segurança.',
  },
];

// FAQ
export const faqItems = [
  {
    question: 'O Finanças 360° é gratuito?',
    answer: 'Sim! Oferecemos um plano gratuito robusto com recursos essenciais. Também temos planos premium com funcionalidades avançadas para quem precisa de mais.',
  },
  {
    question: 'Meus dados bancários estão seguros?',
    answer: 'Absolutamente. Utilizamos criptografia de nível bancário (AES-256), autenticação de dois fatores e conformidade total com a LGPD. Seus dados nunca são compartilhados com terceiros.',
  },
  {
    question: 'Posso usar em vários dispositivos?',
    answer: 'Sim! Seus dados são sincronizados automaticamente entre todos os seus dispositivos - web, celular e desktop.',
  },
  {
    question: 'É possível importar dados de outras ferramentas?',
    answer: 'Sim, você pode importar planilhas CSV e Excel com suas transações. Também oferecemos importação de outros apps financeiros populares.',
  },
  {
    question: 'Preciso de conhecimento técnico para usar?',
    answer: 'Não! O Finanças 360° foi desenvolvido para ser extremamente intuitivo. Qualquer pessoa consegue usar, independente do nível de conhecimento técnico.',
  },
  {
    question: 'Posso compartilhar com minha família?',
    answer: 'Sim! Você pode criar dashboards compartilhados e definir diferentes níveis de permissão para cada membro da família.',
  },
];
