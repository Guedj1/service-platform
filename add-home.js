const fs = require('fs');
const content = fs.readFileSync('./server/server.js', 'utf8');

const homepage = `
app.get('/', (req, res) => {
    res.send('<h1>ServiceN Platform</h1><a href="/create-service?v=4">Formulaire</a> | <a href="/login">Login</a>');
});
`;

if(!content.includes("app.get('/',")) {
    const newContent = content.replace(/app\.get\(.*'\/api'.*\)/, homepage + '\n$&');
    fs.writeFileSync('./server/server.js', newContent);
    console.log('Page d\\'accueil ajoutée');
}
