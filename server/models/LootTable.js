const mongoose = require('mongoose');

const LootTableSchema = new mongoose.Schema({});

module.exports = mongoose.model('LootTable', LootTableSchema);
