const mongoose = require('mongoose');

const GuildMemberSchema = new mongoose.Schema({});

module.exports = mongoose.model('GuildMember', GuildMemberSchema);
