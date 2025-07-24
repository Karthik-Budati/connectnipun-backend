const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  skill: { type: String, required: true },
  district: { type: String, required: true },
  mandal: { type: String },
  village: { type: String },
  pincode: { type: String, required: true },
  image: { type: String },
  qrUrl: {
    type: String
  },
  workImages: [{ type: String }],
});

module.exports = mongoose.model('Worker', workerSchema);