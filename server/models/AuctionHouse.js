const mongoose = require('mongoose');

const AuctionHouseSchema = new mongoose.Schema({});

module.exports = mongoose.model('AuctionHouse', AuctionHouseSchema);
