const express = require('express');
const router = express.Router();

// GET tous les messages
router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Messages API is working',
        data: [
            {
                id: 1,
                sender: 'Admin',
                message: 'Bienvenue sur la plateforme ServiceN',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                sender: 'Support',
                message: 'Comment pouvons-nous vous aider ?',
                timestamp: new Date().toISOString()
            }
        ]
    });
});

// GET message par ID
router.get('/:id', (req, res) => {
    res.json({
        status: 'success',
        message: `Message ${req.params.id}`,
        data: {
            id: req.params.id,
            sender: 'Test User',
            message: 'Ceci est un message de test',
            timestamp: new Date().toISOString()
        }
    });
});

module.exports = router;
