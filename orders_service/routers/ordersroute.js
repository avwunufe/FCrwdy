const express = require("express")
const router = express.Router();
const Order = require("../models/ordersmodel");
const axios = require("axios")

// GET route to find if a product has been purchased by a user (trigged by axios on products/details/:id)
router.get("/myorders", async (req, res)=>{
    try {
    const foundOrder = await Order.findOne({$and: [{userId: req.query.userId}, { 'orderList.item._id': req.query.productId }]})
    res.send(foundOrder)
    } catch (error) {
        console.log(error)
    }
})
// POST route to instantiate new order document (trigged by axios on users/checkout/:id on payment completion)
router.post("/create", async (req, res)=>{
    try {
        console.log(req.body)
        const createdOrder = await Order.create(req.body)
        res.send(createdOrder)
    } catch (error) {
        console.error(error)
    }
})

module.exports = router