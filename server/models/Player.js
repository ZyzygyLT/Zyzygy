const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({});

module.exports = mongoose.model('Player', PlayerSchema);
