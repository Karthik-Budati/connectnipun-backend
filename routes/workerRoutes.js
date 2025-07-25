const express = require('express');
const router = express.Router();
const multer = require('../middleware/multer'); // multer using cloudinary storage
const Worker = require('../models/Worker');
const generateQR = require('../utils/generateQR');
const isVerified = require('../middleware/isVerified');
const path = require('path');
const fs = require('fs');

// POST: Register Worker
router.post('/register', multer.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const workerData = {
      name: req.body.name,
      mobile: req.body.mobile,
      skill: req.body.skill,
      district: req.body.district,
      mandal: req.body.mandal,
      village: req.body.village,
      pincode: req.body.pincode,
      image: req.file.path, 
    };

    const newWorker = new Worker(workerData);
    await newWorker.save();

    const qrUrl = await generateQR(newWorker); 
    newWorker.qrUrl = qrUrl;
    await newWorker.save();

    res.status(201).json({ message: 'Worker registered', qrPath: qrUrl });
  } catch (err) {
    console.error('Worker register error:', err);
    res.status(500).json({ error: 'Failed to register worker', details: err.message });
  }
});

// GET: Check if mobile exists
router.get('/check/:mobile', async (req, res) => {
  try {
    const worker = await Worker.findOne({ mobile: req.params.mobile.trim() });
    if (worker) {
      res.json({ exists: true, id: worker._id });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error('Mobile check error:', err);
    res.status(500).json({ error: 'Server error during mobile check' });
  }
});

// GET: All Workers
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find({});
    res.json(workers);
  } catch (err) {
    console.error('Error fetching workers:', err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// GET: Public profile view by ID (for QR code scanning)
router.get('/public/:id', async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id });
    if (!worker) return res.status(404).send('<h1>Worker Not Found</h1>');

    res.send(`
      <html>
        <head>
          <title>${worker.name} - Worker Profile</title>
          <style>
            body { font-family: sans-serif; background: #f2f2f2; padding: 20px; }
            .card { background: white; padding: 20px; border-radius: 10px; max-width: 400px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            img { width: 100%; border-radius: 10px; }
            h2 { margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${worker.image}" alt="${worker.name}" />
            <h2>${worker.name}</h2>
            <p><strong>Mobile:</strong> ${worker.mobile}</p>
            <p><strong>Skill:</strong> ${worker.skill}</p>
            <p><strong>Location:</strong> ${worker.village}, ${worker.mandal}, ${worker.district} - ${worker.pincode}</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Public worker profile error:', err);
    res.status(500).send('<h1>Internal Server Error</h1>');
  }
});

// GET: Get Worker by ID (protected)
router.get('/:id', isVerified, async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (err) {
    console.error('Error fetching worker:', err);
    res.status(500).json({ error: 'Server error fetching worker' });
  }
});

// POST: Upload Work Image
router.post('/:id/upload-work-image', multer.single('workImage'), async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const imageUrl = req.file.path; 
    worker.workImages = worker.workImages ? [...worker.workImages, imageUrl] : [imageUrl];
    await worker.save();

    res.json({ message: 'Image uploaded', imagePath: imageUrl });
  } catch (err) {
    console.error('Upload image error:', err);
    res.status(500).json({ error: 'Error uploading work image' });
  }
});



module.exports = router;
