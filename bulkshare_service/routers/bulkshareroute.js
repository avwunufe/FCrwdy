const express = require("express");
const router = express.Router();
const Bulkshare = require("../models/bulksharemodels")

// POST route to instantiate new bulkshare document (trigged by axios on users/bulkshare/checkout/:userId/:productId on payment completion)
router.post("/create", async (req, res)=>{
    try {
        const createdBulkshareorder = await Bulkshare.create({
        email: req.body.email,
        product: req.body.product,
        totalParticipants: req.body.totalParticipants,
        currentParticipants: req.body.currentParticipants,
        participants: req.body.participants,
        owner: req.body.owner
        })
        res.send(createdBulkshareorder)
        // await createdBulkshareorder.save()
    } catch (error) {
        console.error(error)
    }
})

module.exports = router