const mongoose = require('mongoose');

const ScanHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analysis_id: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  critical: {
    type: Number,
    default: 0
  },
  high: {
    type: Number,
    default: 0
  },
  medium: {
    type: Number,
    default: 0
  },
  low: {
    type: Number,
    default: 0
  },
  summary: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  findings: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  code: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('ScanHistory', ScanHistorySchema);
