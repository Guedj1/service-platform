const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Modèles
const User = mongoose.model('User');
const Message = mongoose.model('Message');

// ========== MIDDLEWARE ==========
const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    next();
};

// ========== ROUTES PAGES ==========

// Page principale messagerie
router.get('/', requireAuth, async (req, res) => {
    try {
        // Récupérer les conversations
        const messages = await Message.find({
            $or: [
                { expediteurId: req.session.userId },
                { destinataireId: req.session.userId }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('expediteurId', 'prenom nom email')
        .populate('destinataireId', 'prenom nom email');
        
        // Grouper par conversation
        const conversations = {};
        messages.forEach(msg => {
            const convId = msg.conversationId;
            if (!conversations[convId]) {
                conversations[convId] = {
                    id: convId,
                    interlocuteur: msg.expediteurId._id.toString() === req.session.userId ? 
                                  msg.destinataireId : msg.expediteurId,
                  messages: [],
                  lastMessage: msg.createdAt,
                  unread: false
                };
            }
            conversations[convId].messages.push(msg);
            
            // Marquer comme non lu si c'est pour l'utilisateur actuel et non lu
            if (msg.destinataireId._id.toString() === req.session.userId && !msg.lu) {
                conversations[convId].unread = true;
            }
        });
        
        // Convertir en tableau et trier par date
        const conversationsList = Object.values(conversations).sort((a, b) => 
            new Date(b.lastMessage) - new Date(a.lastMessage)
        );
        
        // Récupérer tous les utilisateurs pour démarrer une nouvelle conversation
        const users = await User.find({ _id: { $ne: req.session.userId } })
            .select('prenom nom email role')
            .limit(50);
        
        res.send(renderTemplate('Messagerie', `
            <div class="messagerie-container">
                <div class="container">
                    <div class="messagerie-header">
                        <h1><i class="fas fa-comments"></i> Messagerie</h1>
                        <button class="btn btn-primary" onclick="openNewMessageModal()">
                            <i class="fas fa-plus"></i> Nouveau message
                        </button>
                    </div>
                    
                    <div class="messagerie-layout">
                        <!-- Liste des conversations -->
                        <div class="conversations-list">
                            <h3><i class="fas fa-inbox"></i> Conversations</h3>
                            
                            ${conversationsList.length > 0 ? 
                                conversationsList.map(conv => `
                                    <a href="/messagerie/conversation/${conv.interlocuteur._id}" class="conversation-item ${conv.unread ? 'unread' : ''}">
                                        <div class="conversation-avatar">
                                            <i class="fas fa-user-circle"></i>
                                        </div>
                                        <div class="conversation-info">
                                            <h4>${conv.interlocuteur.prenom} ${conv.interlocuteur.nom}</h4>
                                            <p class="conversation-preview">
                                                ${conv.messages[0]?.contenu?.substring(0, 50) || 'Aucun message'}...
                                            </p>
                                        </div>
                                        <div class="conversation-meta">
                                            <span class="conversation-time">
                                                ${formatDate(conv.lastMessage)}
                                            </span>
                                            ${conv.unread ? '<span class="badge-unread"></span>' : ''}
                                        </div>
                                    </a>
                                `).join('') 
                                : 
                                '<div class="empty-state"><p>Aucune conversation</p></div>'
                            }
                        </div>
                        
                        <!-- Zone de bienvenue -->
                        <div class="conversation-area">
                            <div class="welcome-message">
                                <div class="welcome-icon">
                                    <i class="fas fa-comment-dots"></i>
                                </div>
                                <h2>Bienvenue dans la messagerie</h2>
                                <p>Sélectionnez une conversation ou démarrez-en une nouvelle</p>
                                <button class="btn btn-primary" onclick="openNewMessageModal()">
                                    <i class="fas fa-paper-plane"></i> Envoyer un message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal nouveau message -->
            <div id="newMessageModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-paper-plane"></i> Nouveau message</h3>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="newMessageForm" class="message-form">
                            <div class="form-group">
                                <label class="form-label">Destinataire *</label>
                                <select id="destinataireSelect" class="form-control" required>
                                    <option value="">Sélectionnez un destinataire</option>
                                    ${users.map(user => `
                                        <option value="${user._id}">
                                            ${user.prenom} ${user.nom} (${user.email})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Sujet (optionnel)</label>
                                <input type="text" id="messageSujet" class="form-control" placeholder="Sujet du message">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Message *</label>
                                <textarea id="messageContenu" class="form-control" rows="6" 
                                          placeholder="Tapez votre message ici..." required></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                                    Annuler
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-paper-plane"></i> Envoyer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <script>
                // Fonctions pour la modale
                function openNewMessageModal() {
                    document.getElementById('newMessageModal').style.display = 'flex';
                }
                
                function closeModal() {
                    document.getElementById('newMessageModal').style.display = 'none';
                }
                
                // Gestion du formulaire
                document.getElementById('newMessageForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const destinataireId = document.getElementById('destinataireSelect').value;
                    const sujet = document.getElementById('messageSujet').value;
                    const contenu = document.getElementById('messageContenu').value;
                    
                    if (!destinataireId || !contenu) {
                        alert('Veuillez remplir tous les champs obligatoires');
                        return;
                    }
                    
                    const submitBtn = this.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
                    
                    try {
                        const response = await fetch('/api/messagerie/envoyer', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                destinataireId,
                                sujet,
                                contenu
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            showNotification('Message envoyé avec succès!', 'success');
                            closeModal();
                            // Rediriger vers la conversation
                            window.location.href = '/messagerie/conversation/' + destinataireId;
                        } else {
                            showNotification(result.message || 'Erreur lors de l\'envoi', 'error');
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = originalText;
                        }
                    } catch (error) {
                        showNotification('Erreur de connexion', 'error');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }
                });
                
                // Fermer la modale en cliquant à l'extérieur
                window.onclick = function(event) {
                    const modal = document.getElementById('newMessageModal');
                    if (event.target === modal) {
                        closeModal();
                    }
                };
                
                // Fonction de formatage de date
                function formatDate(dateString) {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diff = now - date;
                    
                    if (diff < 60000) return 'À l\'instant';
                    if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
                    if (diff < 86400000) return Math.floor(diff / 3600000) + ' h';
                    if (diff < 604800000) return Math.floor(diff / 86400000) + ' j';
                    return date.toLocaleDateString();
                }
            </script>
            
            <style>
                /* Styles spécifiques à la messagerie */
                .messagerie-container {
                    padding: 2rem 0;
                    min-height: 70vh;
                }
                
                .messagerie-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                
                .messagerie-layout {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 2rem;
                    background: white;
                    border-radius: var(--border-radius);
                    box-shadow: var(--box-shadow);
                    overflow: hidden;
                    min-height: 600px;
                }
                
                .conversations-list {
                    border-right: 1px solid #e5e7eb;
                    padding: 1.5rem;
                    overflow-y: auto;
                }
                
                .conversation-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    border-radius: var(--border-radius);
                    text-decoration: none;
                    color: inherit;
                    margin-bottom: 0.5rem;
                    transition: var(--transition);
                    border: 1px solid transparent;
                }
                
                .conversation-item:hover, .conversation-item.active {
                    background: var(--light-color);
                    border-color: var(--primary-color);
                }
                
                .conversation-item.unread {
                    background: #f0f9ff;
                    border-left: 3px solid var(--primary-color);
                }
                
                .conversation-avatar {
                    width: 40px;
                    height: 40px;
                    background: var(--primary-color);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 1rem;
                    font-size: 1.2rem;
                }
                
                .conversation-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .conversation-info h4 {
                    margin: 0;
                    font-size: 1rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .conversation-preview {
                    margin: 0.25rem 0 0 0;
                    color: #6b7280;
                    font-size: 0.9rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .conversation-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.25rem;
                }
                
                .conversation-time {
                    font-size: 0.8rem;
                    color: #9ca3af;
                }
                
                .badge-unread {
                    width: 10px;
                    height: 10px;
                    background: var(--primary-color);
                    border-radius: 50%;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #6b7280;
                }
                
                .conversation-area {
                    padding: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .welcome-message {
                    text-align: center;
                    max-width: 400px;
                }
                
                .welcome-icon {
                    font-size: 4rem;
                    color: var(--primary-color);
                    margin-bottom: 1.5rem;
                }
                
                /* Modal */
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-content {
                    background: white;
                    border-radius: var(--border-radius);
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                }
                
                .modal-body {
                    padding: 1.5rem;
                }
                
                .message-form {
                    margin: 0;
                }
                
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                
                @media (max-width: 768px) {
                    .messagerie-layout {
                        grid-template-columns: 1fr;
                    }
                    
                    .conversations-list {
                        border-right: none;
                        border-bottom: 1px solid #e5e7eb;
                    }
                }
            </style>
        `, req));
        
    } catch (error) {
        console.error('Erreur messagerie:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Page de conversation
router.get('/conversation/:userId', requireAuth, async (req, res) => {
    try {
        const destinataireId = req.params.userId;
        const expediteurId = req.session.userId;
        const conversationId = generateConversationId(expediteurId, destinataireId);
        
        // Récupérer le destinataire
        const destinataire = await User.findById(destinataireId).select('prenom nom email');
        if (!destinataire) {
            return res.redirect('/messagerie');
        }
        
        // Récupérer les messages de la conversation
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('expediteurId', 'prenom nom')
            .populate('destinataireId', 'prenom nom');
        
        // Marquer les messages comme lus
        await Message.updateMany(
            { 
                conversationId, 
                destinataireId: expediteurId,
                lu: false 
            },
            { $set: { lu: true } }
        );
        
        // Récupérer les autres conversations pour la sidebar
        const allMessages = await Message.find({
            $or: [
                { expediteurId: req.session.userId },
                { destinataireId: req.session.userId }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('expediteurId', 'prenom nom email')
        .populate('destinataireId', 'prenom nom email');
        
        // Grouper par conversation
        const conversations = {};
        allMessages.forEach(msg => {
            const convId = msg.conversationId;
            if (!conversations[convId]) {
                conversations[convId] = {
                    id: convId,
                    interlocuteur: msg.expediteurId._id.toString() === req.session.userId ? 
                                  msg.destinataireId : msg.expediteurId,
                    messages: [msg],
                    lastMessage: msg.createdAt,
                    unread: false
                };
            }
            
            if (msg.destinataireId._id.toString() === req.session.userId && !msg.lu) {
                conversations[convId].unread = true;
            }
        });
        
        const conversationsList = Object.values(conversations).sort((a, b) => 
            new Date(b.lastMessage) - new Date(a.lastMessage)
        );
        
        res.send(renderTemplate(`Conversation avec ${destinataire.prenom}`, `
            <div class="messagerie-container">
                <div class="container">
                    <div class="messagerie-header">
                        <h1><i class="fas fa-comments"></i> Messagerie</h1>
                        <a href="/messagerie" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Retour
                        </a>
                    </div>
                    
                    <div class="messagerie-layout">
                        <!-- Liste des conversations -->
                        <div class="conversations-list">
                            <h3><i class="fas fa-inbox"></i> Conversations</h3>
                            
                            ${conversationsList.map(conv => `
                                <a href="/messagerie/conversation/${conv.interlocuteur._id}" 
                                   class="conversation-item ${conv.id === conversationId ? 'active' : ''} ${conv.unread ? 'unread' : ''}">
                                    <div class="conversation-avatar">
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                    <div class="conversation-info">
                                        <h4>${conv.interlocuteur.prenom} ${conv.interlocuteur.nom}</h4>
                                        <p class="conversation-preview">
                                            ${conv.messages[0]?.contenu?.substring(0, 40) || 'Aucun message'}...
                                        </p>
                                    </div>
                                    <div class="conversation-meta">
                                        <span class="conversation-time">
                                            ${formatDate(conv.lastMessage)}
                                        </span>
                                        ${conv.unread ? '<span class="badge-unread"></span>' : ''}
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                        
                        <!-- Zone de conversation -->
                        <div class="conversation-detail">
                            <div class="conversation-header">
                                <div class="conversation-user">
                                    <div class="user-avatar">
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                    <div class="user-info">
                                        <h3>${destinataire.prenom} ${destinataire.nom}</h3>
                                        <p class="user-email">${destinataire.email}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="messages-container" id="messagesContainer">
                                ${messages.length > 0 ? 
                                    messages.map(msg => `
                                        <div class="message ${msg.expediteurId._id.toString() === expediteurId ? 'sent' : 'received'}">
                                            <div class="message-content">
                                                <p>${msg.contenu}</p>
                                                <span class="message-time">
                                                    ${formatTime(msg.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    `).join('') 
                                    : 
                                    '<div class="empty-conversation"><p>Aucun message échangé</p></div>'
                                }
                            </div>
                            
                            <div class="message-input-area">
                                <form id="messageForm" class="message-form-inline">
                                    <input type="hidden" id="destinataireId" value="${destinataireId}">
                                    <div class="input-group">
                                        <textarea id="messageInput" class="form-control" 
                                                  placeholder="Tapez votre message..." rows="1"></textarea>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                // Auto-scroll vers les derniers messages
                const messagesContainer = document.getElementById('messagesContainer');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
                
                // Gestion de l'envoi de message
                document.getElementById('messageForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const destinataireId = document.getElementById('destinataireId').value;
                    const contenu = document.getElementById('messageInput').value.trim();
                    
                    if (!contenu) return;
                    
                    const submitBtn = this.querySelector('button[type="submit"]');
                    const originalHtml = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    
                    try {
                        const response = await fetch('/api/messagerie/envoyer', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                destinataireId,
                                contenu
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            // Ajouter le message à l'interface
                            const messageDiv = document.createElement('div');
                            messageDiv.className = 'message sent';
                            messageDiv.innerHTML = \`
                                <div class="message-content">
                                    <p>\${contenu}</p>
                                    <span class="message-time">À l'instant</span>
                                </div>
                            \`;
                            
                            const emptyState = document.querySelector('.empty-conversation');
                            if (emptyState) emptyState.remove();
                            
                            messagesContainer.appendChild(messageDiv);
                            document.getElementById('messageInput').value = '';
                            
                            // Scroll vers le bas
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        } else {
                            showNotification(result.message || 'Erreur', 'error');
                        }
                    } catch (error) {
                        showNotification('Erreur de connexion', 'error');
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalHtml;
                    }
                });
                
                // Auto-resize du textarea
                const textarea = document.getElementById('messageInput');
                if (textarea) {
                    textarea.addEventListener('input', function() {
                        this.style.height = 'auto';
                        this.style.height = (this.scrollHeight) + 'px';
                    });
                }
                
                // Fonctions utilitaires
                function formatDate(dateString) {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diff = now - date;
                    
                    if (diff < 60000) return 'À l\'instant';
                    if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
                    if (diff < 86400000) return Math.floor(diff / 3600000) + ' h';
                    if (diff < 604800000) return Math.floor(diff / 86400000) + ' j';
                    return date.toLocaleDateString();
                }
                
                function formatTime(dateString) {
                    const date = new Date(dateString);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            </script>
            
            <style>
                .conversation-detail {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .conversation-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .conversation-user {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .user-avatar {
                    width: 50px;
                    height: 50px;
                    background: var(--primary-color);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                
                .user-info h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                
                .user-email {
                    margin: 0.25rem 0 0 0;
                    color: #6b7280;
                    font-size: 0.9rem;
                }
                
                .messages-container {
                    flex: 1;
                    padding: 1.5rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .message {
                    max-width: 70%;
                    display: flex;
                }
                
                .message.sent {
                    align-self: flex-end;
                }
                
                .message.sent .message-content {
                    background: var(--primary-color);
                    color: white;
                    border-radius: 18px 18px 0 18px;
                }
                
                .message.received {
                    align-self: flex-start;
                }
                
                .message.received .message-content {
                    background: #f3f4f6;
                    color: var(--dark-color);
                    border-radius: 18px 18px 18px 0;
                }
                
                .message-content {
                    padding: 0.75rem 1rem;
                    position: relative;
                }
                
                .message-content p {
                    margin: 0 0 0.5rem 0;
                    word-wrap: break-word;
                }
                
                .message-time {
                    font-size: 0.75rem;
                    opacity: 0.7;
                    display: block;
                    text-align: right;
                }
                
                .empty-conversation {
                    text-align: center;
                    padding: 3rem;
                    color: #6b7280;
                }
                
                .message-input-area {
                    padding: 1.5rem;
                    border-top: 1px solid #e5e7eb;
                }
                
                .message-form-inline {
                    margin: 0;
                }
                
                .input-group {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .input-group textarea {
                    flex: 1;
                    resize: none;
                    min-height: 45px;
                    max-height: 120px;
                    padding: 0.75rem;
                }
                
                .input-group button {
                    align-self: flex-end;
                    padding: 0.75rem 1.5rem;
                }
            </style>
        `, req));
        
    } catch (error) {
        console.error('Erreur conversation:', error);
        res.redirect('/messagerie');
    }
});

// ========== API ROUTES ==========

// Envoyer un message
router.post('/envoyer', requireAuth, async (req, res) => {
    try {
        const { destinataireId, sujet, contenu } = req.body;
        const expediteurId = req.session.userId;
        
        if (!destinataireId || !contenu) {
            return res.json({ success: false, message: 'Destinataire et contenu requis' });
        }
        
        // Vérifier que le destinataire existe
        const destinataire = await User.findById(destinataireId);
        if (!destinataire) {
            return res.json({ success: false, message: 'Destinataire non trouvé' });
        }
        
        // Créer le message
        const conversationId = generateConversationId(expediteurId, destinataireId);
        
        const message = new Message({
            expediteurId,
            destinataireId,
            sujet: sujet || '',
            contenu,
            conversationId
        });
        
        await message.save();
        
        // Populate pour la réponse
        await message.populate('expediteurId', 'prenom nom');
        await message.populate('destinataireId', 'prenom nom');
        
        res.json({ 
            success: true, 
            message: 'Message envoyé',
            data: message 
        });
        
    } catch (error) {
        console.error('Erreur envoi message:', error);
        res.json({ success: false, message: 'Erreur lors de l\'envoi' });
    }
});

// Récupérer les messages d'une conversation
router.get('/api/conversation/:userId', requireAuth, async (req, res) => {
    try {
        const destinataireId = req.params.userId;
        const expediteurId = req.session.userId;
        const conversationId = generateConversationId(expediteurId, destinataireId);
        
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('expediteurId', 'prenom nom')
            .populate('destinataireId', 'prenom nom');
        
        // Marquer comme lus
        await Message.updateMany(
            { 
                conversationId, 
                destinataireId: expediteurId,
                lu: false 
            },
            { $set: { lu: true } }
        );
        
        res.json({ success: true, messages });
        
    } catch (error) {
        res.json({ success: false, message: 'Erreur de récupération' });
    }
});

// Récupérer les conversations
router.get('/api/conversations', requireAuth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { expediteurId: req.session.userId },
                { destinataireId: req.session.userId }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('expediteurId', 'prenom nom email')
        .populate('destinataireId', 'prenom nom email');
        
        // Grouper par conversation
        const conversations = {};
        messages.forEach(msg => {
            const convId = msg.conversationId;
            if (!conversations[convId]) {
                conversations[convId] = {
                    id: convId,
                    interlocuteur: msg.expediteurId._id.toString() === req.session.userId ? 
                                  msg.destinataireId : msg.expediteurId,
                    lastMessage: msg,
                    unread: false
                };
            }
            
            if (msg.destinataireId._id.toString() === req.session.userId && !msg.lu) {
                conversations[convId].unread = true;
            }
        });
        
        const conversationsList = Object.values(conversations).sort((a, b) => 
            new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
        );
        
        res.json({ success: true, conversations: conversationsList });
        
    } catch (error) {
        res.json({ success: false, message: 'Erreur de récupération' });
    }
});

// Marquer tous les messages comme lus
router.post('/marquer-lus/:userId', requireAuth, async (req, res) => {
    try {
        const destinataireId = req.params.userId;
        const expediteurId = req.session.userId;
        const conversationId = generateConversationId(expediteurId, destinataireId);
        
        await Message.updateMany(
            { 
                conversationId, 
                destinataireId: expediteurId,
                lu: false 
            },
            { $set: { lu: true } }
        );
        
        res.json({ success: true, message: 'Messages marqués comme lus' });
        
    } catch (error) {
        res.json({ success: false, message: 'Erreur' });
    }
});

// Supprimer une conversation
router.delete('/conversation/:userId', requireAuth, async (req, res) => {
    try {
        const destinataireId = req.params.userId;
        const expediteurId = req.session.userId;
        const conversationId = generateConversationId(expediteurId, destinataireId);
        
        await Message.deleteMany({ conversationId });
        
        res.json({ success: true, message: 'Conversation supprimée' });
        
    } catch (error) {
        res.json({ success: false, message: 'Erreur de suppression' });
    }
});

module.exports = router;
