import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

// Middleware dinâmico para servir a pasta dist assim que ela existir
app.use((req, res, next) => {
  if (fs.existsSync(distPath)) {
    return express.static(distPath)(req, res, next);
  }
  next();
});

// Fallback SPA: qualquer requisição entrega index.html da pasta dist se existir
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // Caso o servidor inicie antes do build do Vite concluir
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Faculdade Maçônica - Aguardando Build</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b1120; color: #f8fafc; }
          .card { text-align: center; padding: 2.5rem; background: #1e293b; border-radius: 12px; border: 1px solid #334155; max-width: 500px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
          h1 { color: #d97706; margin-bottom: 0.75rem; font-size: 1.5rem; }
          p { color: #94a3b8; line-height: 1.6; }
          code { background: #0f172a; padding: 0.2rem 0.5rem; border-radius: 6px; color: #38bdf8; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Servidor Node.js Iniciado</h1>
          <p>O servidor está ativo, mas a pasta pré-compilada <code>dist/</code> ainda está sendo gerada.</p>
          <p>Aguarde a compilação ou execute <code>npm run build</code> no painel da Hostinger.</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Servidor de Produção] Rodando na porta ${PORT}`);
});
