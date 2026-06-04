# 🚀 Instruções de Instalação - Mind Clone Studio

## Pré-requisitos

Certifique-se de ter:
- **Node.js** (versão 18 ou superior) — _ou_ apenas **Docker** (caminho mais simples)
- Uma **API key da OpenAI** (https://platform.openai.com/api-keys)

## Opção A — Docker (recomendado)

```bash
cp .env.example .env.local     # preencha OPENAI_API_KEY
docker compose up --build
```
Sobe o app + Postgres/pgvector local com schema e seed automáticos. Acesse `http://localhost:3000`.

## Opção B — Node local

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
```
Edite `.env.local` e preencha `OPENAI_API_KEY` e `DATABASE_URL` (seu Postgres com pgvector).

### 3. Criar o banco de dados
```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/seed.sql   # opcional: persona de exemplo "Eugene Schwartz"
```

### 4. Executar o Projeto
```bash
npm run dev
```

### 5. Acessar a Aplicação
Abra seu navegador e acesse: `http://localhost:3000`

## 🎯 Comandos Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linter

## 🐛 Solução de Problemas

### Erro de Dependências
Se houver problemas com dependências:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Porta em Uso
Se a porta 3000 estiver em uso:
```bash
npm run dev -- -p 3001
```

### Problemas com Three.js
Se houver problemas com WebGL:
- Verifique se seu navegador suporta WebGL
- Atualize os drivers da placa de vídeo
- Tente em modo incógnito

## 📱 Testando em Dispositivos

Para testar em dispositivos móveis na mesma rede:
```bash
npm run dev -- --hostname 0.0.0.0
```

Depois acesse: `http://SEU-IP:3000`

## 🎨 Personalização Rápida

### Alterar Cores
Edite `app/globals.css`:
```css
.neon-blue { color: #SUA_COR; }
```

### Alterar Textos
Edite `components/EugeneBrainInterface.tsx`:
```tsx
<h1>SEU TÍTULO</h1>
```

## ✅ Checklist de Verificação

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor rodando (`npm run dev`)
- [ ] Aplicação carregando em `http://localhost:3000`
- [ ] Mente 3D girando
- [ ] Partículas animadas no background
- [ ] Campo de texto funcionando
- [ ] Botão de análise respondendo

## 🆘 Suporte

Se encontrar problemas:
1. Verifique a versão do Node.js
2. Limpe o cache: `npm cache clean --force`
3. Reinstale as dependências
4. Verifique o console do navegador para erros

---

**Pronto para revolucionar sua análise de leads! 🧠✨**
