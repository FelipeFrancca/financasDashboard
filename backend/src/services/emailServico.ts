import { createTransporter, emailFrom } from '../config/email';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailServico {
  private transporter;

  constructor() {
    this.transporter = createTransporter();
  }

  /**
   * Envia um email
   */
  async enviarEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info(`Email enviado com sucesso: ${info.messageId}`);
    } catch (error) {
      logger.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  /**
   * Envia email de alerta de orçamento
   */
  async enviarAlertaOrcamento(params: {
    email: string;
    nome: string;
    categoria: string;
    limite: number;
    gasto: number;
    percentual: number;
  }): Promise<void> {
    const { email, nome, categoria, limite, gasto, percentual } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; padding: 15px; background: white; border-radius: 8px; flex: 1; margin: 0 5px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Orçamento</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${nome}</strong>!</p>
            
            <div class="alert-box">
              <strong>Atenção!</strong> Você atingiu <strong>${percentual}%</strong> do orçamento da categoria <strong>${categoria}</strong>.
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-value">R$ ${gasto.toFixed(2)}</div>
                <div class="stat-label">Gasto Atual</div>
              </div>
              <div class="stat">
                <div class="stat-value">R$ ${limite.toFixed(2)}</div>
                <div class="stat-label">Limite</div>
              </div>
              <div class="stat">
                <div class="stat-value">${percentual}%</div>
                <div class="stat-label">Utilizado</div>
              </div>
            </div>

            <p>Controle seus gastos para não ultrapassar o limite estabelecido.</p>

            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orcamentos" class="btn">
                Ver Orçamentos
              </a>
            </center>
          </div>
          <div class="footer">
            <p>Esta é uma mensagem automática do sistema Finanças Dashboard.</p>
            <p>Se você não deseja receber esses alertas, acesse as configurações de notificações.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Alerta de Orçamento
      
      Olá, ${nome}!
      
      Você atingiu ${percentual}% do orçamento da categoria ${categoria}.
      
      Gasto Atual: R$ ${gasto.toFixed(2)}
      Limite: R$ ${limite.toFixed(2)}
      Utilizado: ${percentual}%
      
      Controle seus gastos para não ultrapassar o limite estabelecido.
    `;

    await this.enviarEmail({
      to: email,
      subject: `⚠️ Alerta: ${percentual}% do orçamento de ${categoria} atingido`,
      html,
      text,
    });
  }

  /**
   * Envia email de alerta de meta
   */
  async enviarAlertaMeta(params: {
    email: string;
    nome: string;
    meta: string;
    valorAlvo: number;
    valorAtual: number;
    percentual: number;
  }): Promise<void> {
    const { email, nome, meta, valorAlvo, valorAtual, percentual } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .progress-bar { background: #e9ecef; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
          .progress-fill { background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; padding: 15px; background: white; border-radius: 8px; flex: 1; margin: 0 5px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #11998e; }
          .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 30px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Progresso da Meta</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${nome}</strong>!</p>
            
            <div class="success-box">
              <strong>Parabéns!</strong> Você alcançou <strong>${percentual}%</strong> da meta <strong>${meta}</strong>!
            </div>

            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(percentual, 100)}%">
                ${percentual}%
              </div>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-value">R$ ${valorAtual.toFixed(2)}</div>
                <div class="stat-label">Valor Atual</div>
              </div>
              <div class="stat">
                <div class="stat-value">R$ ${valorAlvo.toFixed(2)}</div>
                <div class="stat-label">Valor Alvo</div>
              </div>
              <div class="stat">
                <div class="stat-value">R$ ${(valorAlvo - valorAtual).toFixed(2)}</div>
                <div class="stat-label">Falta</div>
              </div>
            </div>

            <p>Continue assim! Você está no caminho certo para alcançar seu objetivo.</p>

            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/metas" class="btn">
                Ver Metas
              </a>
            </center>
          </div>
          <div class="footer">
            <p>Esta é uma mensagem automática do sistema Finanças Dashboard.</p>
            <p>Se você não deseja receber esses alertas, acesse as configurações de notificações.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Progresso da Meta
      
      Olá, ${nome}!
      
      Você alcançou ${percentual}% da meta ${meta}!
      
      Valor Atual: R$ ${valorAtual.toFixed(2)}
      Valor Alvo: R$ ${valorAlvo.toFixed(2)}
      Falta: R$ ${(valorAlvo - valorAtual).toFixed(2)}
      
      Continue assim! Você está no caminho certo para alcançar seu objetivo.
    `;

    await this.enviarEmail({
      to: email,
      subject: `🎯 Progresso: ${percentual}% da meta ${meta} alcançado`,
      html,
      text,
    });
  }

  /**
   * Envia email de boas-vindas
   */
  async enviarBoasVindas(params: {
    email: string;
    nome: string;
  }): Promise<void> {
    const { email, nome } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .features { margin: 20px 0; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao Finanças Dashboard!</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${nome}</strong>!</p>
            
            <p>Estamos muito felizes em tê-lo(a) conosco! O Finanças Dashboard é sua ferramenta completa para gerenciar suas finanças pessoais de forma simples e eficiente.</p>

            <div class="features">
              <div class="feature">
                <strong>💰 Controle de Transações</strong>
                <p>Registre e acompanhe todas as suas receitas e despesas em um só lugar.</p>
              </div>
              <div class="feature">
                <strong>📊 Orçamentos Inteligentes</strong>
                <p>Crie orçamentos por categoria e receba alertas quando atingir limites.</p>
              </div>
              <div class="feature">
                <strong>🎯 Metas Financeiras</strong>
                <p>Defina metas e acompanhe seu progresso em direção aos seus objetivos.</p>
              </div>
              <div class="feature">
                <strong>📈 Relatórios Detalhados</strong>
                <p>Visualize gráficos e relatórios para entender melhor suas finanças.</p>
              </div>
            </div>

            <p>Comece agora mesmo a organizar suas finanças!</p>

            <center>
              <a href="${process.env.FRONTEND_URL}" class="btn">
                Acessar Dashboard
              </a>
            </center>
          </div>
          <div class="footer">
            <p>Obrigado por se cadastrar no Finanças Dashboard!</p>
            <p>Se tiver alguma dúvida, não hesite em entrar em contato.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo ao Finanças Dashboard!
      
      Olá, ${nome}!
      
      Estamos muito felizes em tê-lo(a) conosco! O Finanças Dashboard é sua ferramenta completa para gerenciar suas finanças pessoais de forma simples e eficiente.
      
      Recursos disponíveis:
      - Controle de Transações
      - Orçamentos Inteligentes
      - Metas Financeiras
      - Relatórios Detalhados
      
      Comece agora mesmo a organizar suas finanças!
    `;

    await this.enviarEmail({
      to: email,
      subject: '🎉 Bem-vindo ao Finanças Dashboard!',
      html,
      text,
    });
  }

  /**
   * Envia email de notificação de compartilhamento de dashboard
   */
  async enviarNotificacaoCompartilhamento(params: {
    email: string;
    nomeDestinatario: string;
    nomeRemetente: string;
    dashboardTitle: string;
    dashboardId: string;
    role: 'VIEWER' | 'EDITOR';
  }): Promise<void> {
    const { email, nomeDestinatario, nomeRemetente, dashboardTitle, dashboardId, role } = params;

    const roleText = role === 'EDITOR' ? 'Editor' : 'Visualizador';
    const roleDescription = role === 'EDITOR'
      ? 'Você pode visualizar e editar transações neste dashboard.'
      : 'Você pode visualizar os dados deste dashboard.';
    const roleColor = role === 'EDITOR' ? '#f39c12' : '#3498db';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .share-box { background: white; border-radius: 12px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .share-icon { font-size: 48px; text-align: center; margin-bottom: 15px; }
          .dashboard-name { font-size: 20px; font-weight: bold; color: #333; text-align: center; margin-bottom: 10px; }
          .shared-by { color: #666; text-align: center; font-size: 14px; margin-bottom: 20px; }
          .role-badge { 
            display: inline-block; 
            padding: 8px 20px; 
            background: ${roleColor}; 
            color: white; 
            border-radius: 20px; 
            font-weight: bold;
            font-size: 14px;
          }
          .role-container { text-align: center; margin: 20px 0; }
          .role-description { color: #666; text-align: center; font-size: 14px; margin-top: 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { 
            display: inline-block; 
            padding: 14px 35px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold;
            font-size: 16px;
          }
          .btn:hover { opacity: 0.9; }
          .btn-container { text-align: center; margin: 25px 0; }
          .divider { border-top: 1px solid #eee; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Novo Dashboard Compartilhado!</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${nomeDestinatario || 'Usuário'}</strong>!</p>
            
            <div class="share-box">
              <div class="share-icon">🤝</div>
              <div class="dashboard-name">${dashboardTitle}</div>
              <div class="shared-by">Compartilhado por <strong>${nomeRemetente}</strong></div>
              
              <div class="divider"></div>
              
              <div class="role-container">
                <span class="role-badge">${roleText}</span>
                <div class="role-description">${roleDescription}</div>
              </div>
            </div>

            <div class="btn-container">
              <a href="${frontendUrl}/dashboard/${dashboardId}" class="btn">
                Acessar Dashboard
              </a>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center;">
              Você agora pode acessar este dashboard diretamente pela sua conta.
            </p>
          </div>
          <div class="footer">
            <p>Esta é uma mensagem automática do sistema Finanças Dashboard.</p>
            <p>Se você não esperava receber este email, pode ignorá-lo com segurança.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Novo Dashboard Compartilhado!
      
      Olá, ${nomeDestinatario || 'Usuário'}!
      
      ${nomeRemetente} compartilhou o dashboard "${dashboardTitle}" com você.
      
      Sua permissão: ${roleText}
      ${roleDescription}
      
      Acesse: ${frontendUrl}/dashboard/${dashboardId}
      
      ---
      Esta é uma mensagem automática do sistema Finanças Dashboard.
    `;

    await this.enviarEmail({
      to: email,
      subject: `📊 ${nomeRemetente} compartilhou um dashboard com você`,
      html,
      text,
    });
  }

  /**
   * Verifica a conexão com o servidor SMTP
   */
  async verificarConexao(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Conexão com servidor SMTP verificada com sucesso');
      return true;
    } catch (error) {
      logger.error('Erro ao verificar conexão com servidor SMTP:', error);
      return false;
    }
  }

  /**
   * Envia resumo semanal financeiro
   */
  async enviarResumoSemanal(params: {
    email: string;
    nome: string;
    semana: number;
    totalGastos: number;
    totalReceitas: number;
    saldo: number;
    resumo: string;
  }): Promise<void> {
    const { email, nome, semana, totalGastos, totalReceitas, saldo, resumo } = params;

    const saldoColor = saldo >= 0 ? '#38ef7d' : '#ff4b2b';
    const saldoSign = saldo >= 0 ? '+' : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef; border-top: none; }
          .summary-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 25px; }
          .stats { display: flex; justify-content: space-between; margin: 20px 0; gap: 10px; }
          .stat { text-align: center; padding: 15px 10px; background: white; border-radius: 8px; flex: 1; border: 1px solid #eee; }
          .stat-value { font-size: 18px; font-weight: bold; color: #333; }
          .stat-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px; }
          .ai-summary { background: #e8f0fe; border-left: 4px solid #4285f4; padding: 15px; border-radius: 4px; color: #3c4043; font-size: 15px; margin-bottom: 25px; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 25px; background: #2a5298; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .btn:hover { background: #1e3c72; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 24px;">📊 Resumo Semanal</h1>
            <p style="margin:5px 0 0; opacity: 0.8;">Semana ${semana}</p>
          </div>
          <div class="content">
            <p>Olá, <strong>${nome}</strong>!</p>
            
            <p>Aqui está o resumo da sua vida financeira nesta semana:</p>

            <div class="stats">
              <div class="stat">
                <div class="stat-value" style="color: #28a745;">R$ ${totalReceitas.toFixed(2)}</div>
                <div class="stat-label">Receitas</div>
              </div>
              <div class="stat">
                <div class="stat-value" style="color: #dc3545;">R$ ${totalGastos.toFixed(2)}</div>
                <div class="stat-label">Despesas</div>
              </div>
              <div class="stat">
                <div class="stat-value" style="color: ${saldoColor};">${saldoSign}R$ ${Math.abs(saldo).toFixed(2)}</div>
                <div class="stat-label">Saldo</div>
              </div>
            </div>

            <div class="summary-card">
              <h3 style="margin-top:0; color:#444;">💡 Análise Inteligente</h3>
              <div class="ai-summary" style="white-space: pre-wrap;">${resumo}</div>
            </div>

            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/analise" class="btn">
                Ver Análise Completa
              </a>
            </center>
          </div>
          <div class="footer">
            <p>Enviado automaticamente pelo Finanças Dashboard.</p>
            <p><a href="#" style="color:#888;">Gerenciar notificações</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.enviarEmail({
      to: email,
      subject: `📊 Resumo Financeiro - Semana ${semana}`,
      html,
      text: resumo,
    });
  }

  /**
   * Envia resumo mensal com insights
   */
  async enviarResumoMensal(params: {
    email: string;
    nome: string;
    mes: string;
    totalGastos: number;
    totalReceitas: number;
    saldo: number;
    resumo: string;
  }): Promise<void> {
    const { email, nome, mes, totalGastos, totalReceitas, saldo, resumo } = params;
    const saldoColor = saldo >= 0 ? '#38ef7d' : '#ff4b2b';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%); color: white; padding: 40px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #fff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .big-stat { text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; }
          .big-value { font-size: 36px; font-weight: 800; color: ${saldoColor}; margin-bottom: 5px; }
          .big-label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
          .insight-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px; margin-bottom: 30px; }
          .btn { display: inline-block; padding: 15px 35px; background: #4a00e0; color: white; text-decoration: none; border-radius: 30px; font-weight: bold; box-shadow: 0 4px 15px rgba(74, 0, 224, 0.3); }
          .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
          .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
          .footer { text-align: center; padding: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 28px;">Relatório Mensal</h1>
            <p style="margin:10px 0 0; opacity: 0.9;">${mes}</p>
          </div>
          <div class="content">
            <p>Olá, <strong>${nome}</strong>!</p>
            <p>O mês de ${mes} fechou. Veja como foi seu desempenho financeiro:</p>

            <div class="big-stat">
              <div class="big-value">R$ ${Math.abs(saldo).toFixed(2)}</div>
              <div class="big-label">Saldo do Mês ${saldo >= 0 ? '(Positivo)' : '(Negativo)'}</div>
            </div>

            <div class="metrics">
              <div class="metric">
                <div style="font-weight:bold; color:#28a745;">R$ ${totalReceitas.toFixed(2)}</div>
                <div style="font-size:12px; color:#666;">Receitas</div>
              </div>
              <div class="metric">
                <div style="font-weight:bold; color:#dc3545;">R$ ${totalGastos.toFixed(2)}</div>
                <div style="font-size:12px; color:#666;">Despesas</div>
              </div>
            </div>

            <h3 style="margin-top:0;">🤖 Insights da IA</h3>
            <div class="insight-box" style="white-space: pre-wrap;">${resumo}</div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/analise/mensal" class="btn">
                Ver Relatório Completo
              </a>
            </div>
          </div>
          <div class="footer">
            <p>Finanças Dashboard - Seu assistente financeiro inteligente.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.enviarEmail({
      to: email,
      subject: `📈 Relatório Mensal - ${mes}`,
      html,
      text: resumo,
    });
  }

  /**
   * Envia insight de gasto específico
   */
  async enviarInsightGasto(params: {
    email: string;
    nome: string;
    titulo: string;
    mensagem: string;
    tipo: 'alerta' | 'dica' | 'conquista';
  }): Promise<void> {
    const { email, nome, titulo, mensagem, tipo } = params;

    let color = '#4a00e0';
    let icon = '💡';

    if (tipo === 'alerta') { color = '#dc3545'; icon = '⚠️'; }
    if (tipo === 'conquista') { color = '#28a745'; icon = '🏆'; }

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: ${color}; color: white; padding: 20px; text-align: center; font-size: 18px; font-weight: bold;">
            ${icon} Novo Insight Financeiro
          </div>
          <div style="padding: 30px;">
            <p>Olá, ${nome}!</p>
            <h2 style="color: #333; margin-top: 0;">${titulo}</h2>
            <p style="color: #555; background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 3px solid ${color};">
              ${mensagem}
            </p>
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #333; color: white; text-decoration: none; border-radius: 5px;">
                Abra o App
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.enviarEmail({
      to: email,
      subject: `${icon} Insight: ${titulo}`,
      html,
      text: `${titulo}\n\n${mensagem}`,
    });
  }
}

export default new EmailServico();
