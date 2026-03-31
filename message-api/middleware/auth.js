const authMiddleware = (req, res, next) => {

  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Unauthorized - Missing x-user-id header' 
    });
  }
  
  req.user = {
    id: userId
  };
  
  next();
};

module.exports = authMiddleware;
