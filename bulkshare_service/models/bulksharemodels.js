const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const bulkshareSchema = new Schema({
email: {
    type: String
},
product: {},
totalParticipants: {
    type: Number
},
currentParticipants: {
    type: Number
},
participants: [],
owner: {},
createdAt: {
    type: Date,
    default: new Date()
},
expiresAt: {
    type: Date,
    default: new Date(+new Date() + 7*24*60*60*1000)
}
})



const Bulkshare = mongoose.model("Bulkshare", bulkshareSchema)
module.exports = Bulkshare