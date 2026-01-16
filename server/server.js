require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes minimales
app.get('/', (req, res) => {
  res.redirect('/create-service?v=4');
});

app.get('/create-service', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Créer Service - ServiceN</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      h1 { color: #333; }
      form { max-width: 500px; }
      input, textarea { width: 100%; padding: 10px; margin: 5px 0; }
      button { background: #4CAF50; color: white; padding: 12px; border: none; }
    </style>
  </head>
  <body>
    <h1>Formulaire de création</h1>
    <form>
      <input type="text" placeholder="Titre" required>
      <textarea placeholder="Description" rows="4"></textarea>
      <input type="number" placeholder="Prix">
      <button type="submit">Créer</button>
    </form>
  </body>
  </html>
  `;
  res.send(html);
});

app.get('/login', (req, res) => {
  res.send('<h1>Login</h1><form><input><input type="password"><button>Login</button></form>');
});

app.listen(PORT, () => {
  console.log('✅ Serveur démarré sur le port ' + PORT);
});
