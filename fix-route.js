const fs = require('fs');
let content = fs.readFileSync('./server/server.js', 'utf8');

// Remplacer la route / par une version fonctionnelle
const newRoute = `app.get('/', (req, res) => {
    res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ServiceN Platform</title>
            <style>
                body { font-family: Arial; padding: 40px; text-align: center; }
                h1 { color: #333; }
                .btn { display: inline-block; padding: 15px 30px; margin: 10px; 
                       background: #4CAF50; color: white; text-decoration: none; 
                       border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>🚀 ServiceN Platform</h1>
            <p>Plateforme de services professionnels</p>
            <div>
                <a href="/create-service?v=4" class="btn">Créer un service</a>
                <a href="/login" class="btn">Se connecter</a>
                <a href="/dashboard" class="btn">Tableau de bord</a>
            </div>
        </body>
        </html>
    \`);
});`;

// Chercher et remplacer la première route /
const routeRegex = /app\.get\(['"]\/['"][^}]+?\n\s*\}\);/s;
if (routeRegex.test(content)) {
    content = content.replace(routeRegex, newRoute);
    fs.writeFileSync('./server/server.js', content);
    console.log('✅ Route / corrigée');
    
    // Vérifier la syntaxe
    try {
        require('./server/server.js');
        console.log('✅ Syntaxe vérifiée - OK');
    } catch (err) {
        console.log('❌ Erreur après correction:', err.message);
    }
} else {
    console.log('❌ Route / non trouvée');
}
