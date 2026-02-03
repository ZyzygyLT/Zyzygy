const mongoose = require('mongoose');

const EnemySchema = new mongoose.Schema({});

module.exports = mongoose.model('Enemy', EnemySchema);
