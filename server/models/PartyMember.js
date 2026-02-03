const mongoose = require('mongoose');

const PartyMemberSchema = new mongoose.Schema({});

module.exports = mongoose.model('PartyMember', PartyMemberSchema);
