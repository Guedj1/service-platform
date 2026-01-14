const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Accès non autorisé. Veuillez vous connecter.' 
    });
  }
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userId || !req.session.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Permissions insuffisantes' 
      });
    }
    
    next();
  };
};

module.exports = { requireAuth, requireRole };
