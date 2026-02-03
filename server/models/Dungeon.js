const mongoose = require('mongoose');

const DungeonSchema = new mongoose.Schema({});

module.exports = mongoose.model('Dungeon', DungeonSchema);
