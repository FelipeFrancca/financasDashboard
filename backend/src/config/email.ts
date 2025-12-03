import nodemailer from 'nodemailer';

// Função para obter configuração atualizada em tempo real
const getEmailConfig = () => ({
  host: process.env.SMTP_HOST || 'smtp-relay.sendinblue.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Aceita certificados alternativos do Brevo
    rejectUnauthorized: true,
    // Aceita nomes alternativos do certificado (altnames)
    servername: process.env.SMTP_HOST || 'smtp-relay.sendinblue.com',
  },
});

export const emailFrom = process.env.EMAIL_FROM || 'noreply@financasdashboard.com';

export const createTransporter = () => {
  return nodemailer.createTransport(getEmailConfig());
};
