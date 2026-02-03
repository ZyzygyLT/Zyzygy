const mongoose = require('mongoose');

const LootTableEntrySchema = new mongoose.Schema({});

module.exports = mongoose.model('LootTableEntry', LootTableEntrySchema);
