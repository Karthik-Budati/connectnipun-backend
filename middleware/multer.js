const multer = require('multer');
const { storage } = require('../utils/cloudinary');
module.exports = multer({ storage });
