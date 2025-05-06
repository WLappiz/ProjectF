const { default: mongoose, Types } = require("mongoose");

const BlackList = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    }
})

module.exports = mongoose.model('blacklist', BlackList)