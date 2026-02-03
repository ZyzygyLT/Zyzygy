const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({});

module.exports = mongoose.model('Party', PartySchema);
