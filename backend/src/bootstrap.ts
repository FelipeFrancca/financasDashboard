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

        // 2. Verificar Migrations (modo rápido em desenvolvimento)
        console.log('\n🗄️  [2/3] Verificando Migrations...');
        const isDevelopment = process.env.NODE_ENV !== 'production';

        if (isDevelopment) {
            // Em desenvolvimento, apenas verifica o status sem aplicar
            try {
                execSync('npx prisma migrate status', {
                    stdio: 'pipe',
                    timeout: 5000 // 5 segundos de timeout
                });
                console.log('   ✅ Migrations OK (desenvolvimento)');
            } catch (error) {
                console.warn('   ⚠️  Migrations podem estar pendentes. Execute manualmente: npx prisma migrate dev');
            }
        } else {
            // Em produção, aplica as migrations
            execSync('npx prisma migrate deploy', { stdio: 'inherit' });
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
