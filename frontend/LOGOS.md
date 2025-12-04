# Guia de Uso das Logomarcas FinChart

Este documento explica como usar as logomarcas do FinChart em seu projeto frontend.

## Arquivos de Logo

Há dois arquivos de logo disponíveis na pasta `/public`:

### 1. **logomarca-finchart.png** (Logo Completo)
- **Tamanho**: 660KB
- **Uso**: Logo principal para uso geral na aplicação
- **Exemplos**: Cabeçalhos, páginas de login, splash screens, branding geral

### 2. **finchart-logo.png** (Logo Compacto/Ícone)
- **Tamanho**: 270KB
- **Uso**: Versão compacta para espaços menores e como favicon
- **Exemplos**: 
  - Favicon do navegador
  - Ícone do aplicativo (mobile/desktop PWA)
  - Botões pequenos
  - Navegação mobile
  - Headers compactos

## Como Usar

### Usando o Componente Logo (Recomendado)

O componente `Logo` fornece uma maneira fácil e consistente de usar as logos:

```tsx
import { Logo } from '../components/Logo';

// Logo completo (padrão)
<Logo />

// Logo completo com largura personalizada
<Logo width={200} />

// Logo compacto/ícone
<Logo variant="icon" width={40} />

// Com estilos adicionais
<Logo 
  variant="full" 
  width={180}
  sx={{ mb: 2, cursor: 'pointer' }}
  onClick={() => navigate('/')}
/>
```

### Propriedades do Componente Logo

| Propriedade | Tipo | Padrão | Descrição |
|-------------|------|--------|-----------|
| `variant` | `'full' \| 'icon'` | `'full'` | Variante do logo a exibir |
| `width` | `string \| number` | `180` (full) / `40` (icon) | Largura do logo |
| `alt` | `string` | `'FinChart Logo'` | Texto alternativo |
| `sx` | `SxProps` | - | Estilos adicionais do Material-UI |

### Uso Direto (Não Recomendado)

Se necessário, você pode referenciar os arquivos diretamente:

```tsx
<img src="/logomarca-finchart.png" alt="FinChart" width="200" />
<img src="/finchart-logo.png" alt="FinChart" width="40" />
```

## Configuração de Favicon e App Icons

O arquivo `index.html` já está configurado com:

- ✅ Favicon para navegadores desktop
- ✅ Apple Touch Icon para iOS
- ✅ Ícones de diferentes tamanhos para PWA
- ✅ Meta tags para web apps mobile

Configuração atual em `index.html`:

```html
<!-- Favicon and App Icons -->
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/finchart-logo.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/finchart-logo.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/finchart-logo.png" />

<!-- Mobile Web App Capable -->
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="FinChart" />
```

## Diretrizes de Uso

### Quando usar o logo completo (`variant="full"`):
- ✅ Página de login
- ✅ Cabeçalho principal da aplicação
- ✅ Páginas de apresentação
- ✅ Áreas com espaço suficiente (>150px de largura)

### Quando usar o logo compacto (`variant="icon"`):
- ✅ Navegação mobile (drawer/menu)
- ✅ Botões de ação
- ✅ Headers compactos
- ✅ Anywhere com espaço limitado (<100px)

## Exemplos de Implementação

### Exemplo 1: Página de Login
```tsx
<Box sx={{ textAlign: "center", mb: 3 }}>
  <Logo variant="full" width={200} sx={{ mb: 2 }} />
  <Typography variant="body2" color="text.secondary">
    Gerencie suas finanças pessoais com facilidade
  </Typography>
</Box>
```

### Exemplo 2: Header Mobile
```tsx
<AppBar position="sticky">
  <Toolbar>
    <Logo variant="icon" width={32} sx={{ mr: 2 }} />
    <Typography variant="h6">FinChart</Typography>
  </Toolbar>
</AppBar>
```

### Exemplo 3: Splash Screen
```tsx
<Box sx={{ 
  display: 'flex', 
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh'
}}>
  <Logo variant="full" width={300} />
  <CircularProgress sx={{ mt: 4 }} />
</Box>
```

## Otimização

- Os arquivos PNG estão otimizados para web
- Use o componente `Logo` que já inclui `object-fit: contain` e `user-select: none`
- A altura é ajustada automaticamente para manter a proporção

## Notas Técnicas

- **Formato**: PNG com transparência
- **Responsividade**: Use `width` como número ou string CSS
- **Performance**: Os arquivos são servidos estaticamente do diretório `/public`
- **Cache**: Configurado automaticamente pelo Vite para otimização
