const express = require("express")
const router = express.Router();
const Product = require("../models/productsmodel");
const axios = require("axios")

router.get("/", async (req, res) => {
    const productList = await Product.find({ category: req.query.category })
    res.send(productList)
})
// // GET route to find a single product (trigged by axios on users/bulkshare on bulkshare get operation)
router.get("/:id", async (req, res)=>{
    try {
    const product = await Product.findById(req.params.id)
    res.send(product)
    } catch (error) {
        res.status(403)
    }
})
//Post route to add product to cart
router.post("/add-to-cart/:id", async (req, res) => {
    if (req.query.userId != undefined) {
        try {
            const item = await Product.findOne({ _id: req.params.id })

            const response = await axios.post(`http://localhost:6000/users/add-to-cart?userId=${req.query.userId}&productId=${req.params.id}`, item)
            console.log(response.data.cart[0])
        } catch (error) {
            console.log(error)
        }
    } else {
        const item = await Product.findOne({ _id: req.params.id })
        res.send({message: "User is not logged in", item: item})
    }

})
//Post route to add bulk purchase item to bulk cart
router.post("/add-to-bulkcart/:id", async (req, res) => {
    if (req.query.userId != undefined) {
        try {
            const item = await Product.findOne({ _id: req.params.id })

            const response = await axios.post(`http://localhost:6000/users/add-to-bulkcart?userId=${req.query.userId}&productId=${req.params.id}`, item)
            console.log(response.data.bulkCart[0])
        } catch (error) {
            console.log(error)
        }
    } else {
        const item = await Product.findOne({ _id: req.params.id })
        res.send({message: "User is not logged in", item: item})
    }

})
// Pseudo POST route for mock creation of data
router.post("/create", async (req, res) => {
    try {
        const newProduct = await Product.create(req.body);
        if (newProduct) {
            res.send("Product created succesfully")
        }
    } catch (error) {
        res.send("Error creating new product")
    }
})
router.get("/details/:id", async (req, res) => {
    try {
        const hasBought = await axios.get(`http://localhost:4000/orders/myorders?userId=${req.query.userId}&productId=${req.params.id}`);
        const item = await Product.findOne({ _id: req.params.id })
        console.log(hasBought.data)
        if (hasBought.data) {
            res.send({hasBought: true, item})
        } else {
            res.send({hasBought: false, item})
        }
    } catch (error) {
        res.status(403)
    }
})

router.post("/details/review/:id", async (req, res) => {
    try {
        let review = req.body.body
        const productToBeReviewed = await Product.findById(req.params.id)
        productToBeReviewed.reviews.push(review);
        await productToBeReviewed.save()
    } catch (error) {
        res.status(403)
    }
})

module.exports = router