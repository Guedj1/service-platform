#!/bin/bash

FILE="server/server.js"

# 1. Ajouter le modèle Message après les autres modèles
sed -i '/const Service = mongoose.model/ a\
\n// ========== MODÈLE MESSAGE ==========\
const messageSchema = new mongoose.Schema({\
    expediteurId: { type: mongoose.Schema.Types.ObjectId, ref: \"User\", required: true },\
    destinataireId: { type: mongoose.Schema.Types.ObjectId, ref: \"User\", required: true },\
    sujet: { type: String, default: \"\" },\
    contenu: { type: String, required: true },\
    lu: { type: Boolean, default: false },\
    createdAt: { type: Date, default: Date.now },\
    conversationId: { type: String, required: true }\
});\
\
const Message = mongoose.model(\"Message\", messageSchema);\
\
// Fonction pour générer un conversationId\
const generateConversationId = (userId1, userId2) => {\
    return [userId1, userId2].sort().join(\"_\");\
};' "$FILE"

# 2. Ajouter la route messagerie avant les routes API
sed -i '/\/\/ ========== API ROUTES ==========/ i\
\n\/\/ ========== MESSAGERIE ==========\
const messagerieRoutes = require(\"./routes/messagerie\");\
app.use(\"/messagerie\", messagerieRoutes);' "$FILE"

echo "✅ Messagerie intégrée dans server.js"
