const mongoose = require('mongoose');

const CombatLogSchema = new mongoose.Schema({});

module.exports = mongoose.model('CombatLog', CombatLogSchema);
