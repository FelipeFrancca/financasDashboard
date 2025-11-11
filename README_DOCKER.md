# 🐳 Guia Docker - Finanças 360°

Este guia explica como executar a aplicação Finanças 360° usando Docker e Docker Compose.

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (versão 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+)

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
# Windows (PowerShell)
Copy-Item .env.docker.example .env

# Linux/Mac
cp .env.docker.example .env
```

Edite o arquivo `.env` e configure pelo menos:
- `DB_PASSWORD`: Senha do PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT (gere com `openssl rand -base64 32`)

### 2. Iniciar a Aplicação

```bash
# Construir e iniciar os containers
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs apenas da aplicação
docker-compose logs -f app
```

A aplicação estará disponível em: **http://localhost:5000**

### 3. Parar a Aplicação

```bash
# Parar os containers
docker-compose down

# Parar e remover volumes (⚠️ apaga dados do banco)
docker-compose down -v
```

## 🔧 Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status dos containers
docker-compose ps

# Reiniciar aplicação
docker-compose restart app

# Reconstruir a imagem da aplicação
docker-compose build app

# Reconstruir sem cache
docker-compose build --no-cache app

# Ver logs em tempo real
docker-compose logs -f

# Executar comando dentro do container
docker-compose exec app sh
```

### Banco de Dados

```bash
# Acessar PostgreSQL
docker-compose exec postgres psql -U postgres -d financas360

# Backup do banco
docker-compose exec postgres pg_dump -U postgres financas360 > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres financas360 < backup.sql

# Ver migrations aplicadas
docker-compose exec app bunx prisma migrate status
```

### Limpeza

```bash
# Remover containers parados
docker-compose down

# Remover containers, volumes e imagens
docker-compose down -v --rmi all

# Limpar sistema Docker (cuidado!)
docker system prune -a --volumes
```

## 📁 Estrutura de Volumes

O Docker Compose cria volumes persistentes para:

- **postgres_data**: Dados do PostgreSQL
- **uploads_data**: Arquivos enviados pelos usuários

Para fazer backup dos volumes:

```bash
# Backup do volume de dados
docker run --rm -v financas360_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Backup dos uploads
docker run --rm -v financas360_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz /data
```

## 🔐 Segurança

### Configurações de Produção

1. **Altere as senhas padrão**:
   ```env
   DB_PASSWORD=sua_senha_forte_e_aleatoria
   JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Configure CORS**:
   ```env
   CORS_ORIGIN=https://seudominio.com
   ```

3. **Use HTTPS**: Configure um reverse proxy (nginx/traefik) com certificado SSL

4. **Isole a rede**: Remova a exposição da porta do PostgreSQL se não for necessária:
   ```yaml
   # Em docker-compose.yml, comente:
   # ports:
   #   - "5432:5432"
   ```

## 🐛 Troubleshooting

### Erro: "port is already allocated"

A porta 5000 está em uso. Altere no `.env`:
```env
APP_PORT=3000
```

Ou pare o processo que está usando a porta 5000.

### Erro: "connection refused" ao PostgreSQL

Aguarde o PostgreSQL inicializar completamente:
```bash
docker-compose logs postgres
```

O healthcheck garante que a app só inicia após o banco estar pronto.

### Migrations não aplicadas

Execute manualmente:
```bash
docker-compose exec app bunx prisma migrate deploy
```

### Prisma Client desatualizado

Regenere o cliente:
```bash
docker-compose exec app bunx prisma generate
```

### Container reiniciando constantemente

Verifique os logs:
```bash
docker-compose logs app
```

Causas comuns:
- `DATABASE_URL` incorreta
- Migrations falharam
- Porta já em uso

### Resetar completamente

```bash
# Parar e remover tudo
docker-compose down -v

# Remover imagem
docker rmi financasdashboard_app

# Reconstruir do zero
docker-compose up --build
```

## 🔄 Atualizações

Para atualizar a aplicação após mudanças no código:

```bash
# 1. Parar os containers
docker-compose down

# 2. Reconstruir a imagem
docker-compose build app

# 3. Reiniciar
docker-compose up -d

# 4. Aplicar novas migrations (se houver)
docker-compose exec app bunx prisma migrate deploy
```

## 📊 Monitoramento

### Health Checks

A aplicação tem health checks configurados:

```bash
# Verificar saúde dos containers
docker-compose ps

# Testar endpoint de health
curl http://localhost:5000/health
```

### Recursos do Container

```bash
# Ver uso de recursos
docker stats

# Ver apenas da aplicação
docker stats financas360-app
```

## 🌐 Deploy em Produção

### Docker Swarm

```bash
# Inicializar swarm
docker swarm init

# Deploy do stack
docker stack deploy -c docker-compose.yml financas360
```

### Kubernetes

Converta o docker-compose para manifests Kubernetes:

```bash
# Instalar kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.28.0/kompose-linux-amd64 -o kompose

# Converter
kompose convert -f docker-compose.yml
```

### Cloud Platforms

- **AWS ECS**: Use o Docker Compose CLI
- **Azure Container Instances**: Use `docker context`
- **Google Cloud Run**: Build e push para GCR

## 📚 Referências

- [Documentação Docker](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Bun Docker Image](https://hub.docker.com/r/oven/bun)

## ❓ Suporte

Para mais informações, consulte:
- [README.md](./README.md) - Visão geral do projeto
- [SETUP.md](./SETUP.md) - Instalação sem Docker
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Configurar Google OAuth
