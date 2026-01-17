const express = require('express');
const router = express.Router();

// Route pour les messages
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Messages API is working',
        data: []
    });
});

module.exports = router;
