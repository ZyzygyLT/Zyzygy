const mongoose = require('mongoose');

const AuctionBidSchema = new mongoose.Schema({});

module.exports = mongoose.model('AuctionBid', AuctionBidSchema);
