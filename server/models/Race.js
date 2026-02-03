const mongoose = require('mongoose');

const RaceSchema = new mongoose.Schema({});

module.exports = mongoose.model('Race', RaceSchema);
