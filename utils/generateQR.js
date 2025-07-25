const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

async function generateQR(worker) {
  const profileURL = `https://connectnipun.onrender.com/api/workers/public/${worker_id}`;

  try {
    const canvas = createCanvas(300, 300);
    await QRCode.toCanvas(canvas, profileURL, {
      width: 300,
      color: {
        dark: '#007acc',
        light: '#ffffff',
      },
    });

    const ctx = canvas.getContext('2d');
    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      const logo = await loadImage(logoPath);
      const logoSize = 60;
      ctx.drawImage(
        logo,
        canvas.width / 2 - logoSize / 2,
        canvas.height / 2 - logoSize / 2,
        logoSize,
        logoSize
      );
    }

    const buffer = canvas.toBuffer('image/png');

    // ✅ Proper upload
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'worker_qrcodes',
          public_id: `qr-${worker._id}`,
          overwrite: true,
        },
        (err, result) => {
          if (err) {
            console.error('Cloudinary upload failed:', err);
            return reject(err);
          }
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

  } catch (err) {
    console.error('QR generation error:', err);
    throw err;
  }
}

module.exports = generateQR;
