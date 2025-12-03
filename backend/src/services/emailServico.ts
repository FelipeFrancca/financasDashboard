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
}

export default new EmailServico();
