import { execSync, spawn } from 'child_process';

async function bootstrap() {
    console.log('\n🚀 INICIANDO BOOTSTRAP DO SISTEMA FINANCEIRO...\n');

    try {
        // 1. Gerar Prisma Client (apenas se necessário)
        console.log('📦 [1/3] Gerando Prisma Client...');
        try {
            execSync('npx prisma generate', { stdio: 'inherit' });
        } catch (error) {
            console.warn('⚠️  Aviso: Prisma Client já pode estar gerado');
        }

        // 2. Verificar e Aplicar Migrations & Seeds
        console.log('\n🗄️  [2/3] Verificando Banco de Dados...');
        const isDevelopment = process.env.NODE_ENV !== 'production';

        try {
            // Aplica migrations pendentes (tanto em dev quanto prod)
            console.log('   🔄 Aplicando migrations...');
            execSync('npx prisma migrate deploy', { stdio: 'inherit' });
            console.log('   ✅ Migrations aplicadas com sucesso');

            // Verifica se precisa rodar seeds (apenas se não houver usuários)
            // Importação dinâmica para garantir que o client já foi gerado
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            const userCount = await prisma.user.count();
            if (userCount === 0) {
                console.log('   🌱 Banco vazio detectado. Rodando seeds...');
                execSync('npx prisma db seed', { stdio: 'inherit' });
                console.log('   ✅ Seeds executados com sucesso');
            } else {
                console.log('   ℹ️  Banco já populado. Pulando seeds.');
            }
            
            await prisma.$disconnect();

        } catch (error) {
            console.error('   ❌ Erro ao preparar banco de dados:', error);
            // Em dev, não mata o processo para permitir correção manual
            if (!isDevelopment) throw error;
        }

        // 3. Iniciar Servidor
        console.log('\n⚡ [3/3] Iniciando API em modo Watch...\n');

        // Inicia o servidor com hot reload
        const server = spawn('bun', ['--watch', 'src/index.ts'], {
            stdio: 'inherit',
            shell: true,
            env: { ...process.env }
        });

        // Mantém o processo principal vivo
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Encerrando servidor...');
            server.kill('SIGINT');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n\n🛑 Encerrando servidor...');
            server.kill('SIGTERM');
            process.exit(0);
        });

        server.on('close', (code) => {
            console.log(`\n📴 Servidor encerrado com código ${code}`);
            process.exit(code ?? 0);
        });

    } catch (error) {
        console.error('\n❌ ERRO FATAL NA INICIALIZAÇÃO:');
        console.error(error);
        process.exit(1);
    }
}

bootstrap();
