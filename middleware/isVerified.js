module.exports = (req, res, next) => {
  const verified = req.headers["x-verified"]; 

  if (verified !== "true") {
    return res.status(401).json({ error: "Access denied. Mobile not verified." });
  }

  next(); 
};
