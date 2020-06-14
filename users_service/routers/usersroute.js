const express = require("express");
const router = express.Router();
const User = require("../models/usersmodel");
const loginAuth = require("../jwtauth");
const bcrypt = require("bcryptjs");
const { registerValidation, loginValidation } = require("../validation");
const jwt = require("jsonwebtoken")
const Cart = require("../cart")
const Bulkcart = require("../bulkcart")
const axios = require("axios")
const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = await jwt.verify(token, "secretkeythatiused")
        const user = await User.findOne({ _id: decoded._id, "tokens.token": token })
        if (!user) {
            throw new Error()
        }
        req.token = token
        req.user = user
        next()
    } catch (error) {
        res.send({ oldUrl: req.url || null, productId: req.params.id || null })
    }
}
//user Sign up route
router.post('/signup', async (req, res) => {

    const { error } = await registerValidation({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        phoneNumber: req.body.phoneNumber
    });
    if (error) return res.status(400).send({ message: error.details[0].message });
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(422).send({ message: "Email already exists!" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    try {
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            phoneNumber: req.body.phoneNumber
        });
        const token = await newUser.generateAuthToken()
        if (req.body.cart !== undefined) {
            newUser.cart = [req.body.cart]
        }
        if (req.body.bulkCart !== undefined) {
            newUser.bulkCart = [req.body.bulkCart]
        }
        await newUser.save()
        if (req.body.productId != undefined) {
            res.send({ newUser, token, oldUrl: req.body.oldUrl, productId: req.body.productId })
        } else if (req.body.oldUrl !== undefined) {
            res.send({ newUser, token, oldUrl: req.body.oldUrl })
        } else {
            res.send({ newUser, token })
        }

    } catch (error) {
        console.log(error)
    }
});
//user Sign in route
router.post('/signin', async (req, res, next) => {
    const { error } = await loginValidation(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });
    const validUser = await User.findOne({ email: req.body.email });
    if (!validUser) return res.status(400).send({ message: "Invalid Email" });
    try {
        const user = await bcrypt.compare(req.body.password, validUser.password);
        if (!user) return res.status(400).send({ message: "Invalid login credentials" });
        const token = await jwt.sign({ _id: validUser._id.toJSON() }, "secretkeythatiused")
        console.log(validUser)
        validUser.tokens = validUser.tokens.concat({ token: token })
        await validUser.save()
        if (req.body.productId != undefined) {
            res.send({ validUser, token, oldUrl: req.body.oldUrl, productId: req.body.productId })
        } else if (req.body.oldUrl !== undefined) {
            res.send({ validUser, token, oldUrl: req.body.oldUrl })
        } else {
            res.send({ validUser, token })
        }

    } catch (error) {
        console.log(error)
        res.status(400).send()
    }
});
router.post("/logout", loginAuth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            token.token !== req.token
        })
        await req.user.save()
    } catch (error) {
        res.status(500).send()
    }
})
// Helper POST route for adding to user cart 
router.post("/add-to-cart", async (req, res) => {
    try {
        if (req.query.userId !== "undefined") {
            const user = await User.findById(req.query.userId);
            const cart = await new Cart(user.cart[0] || {})
            await cart.add(req.body, req.query.productId)
            await User.findByIdAndUpdate(req.query.userId, { "cart": [cart] })
            res.send(user)

        }
    } catch (error) {
        console.log(error)
    }
})
// Helper POST route for adding to user bulkCart
router.post("/add-to-bulkcart", async (req, res) => {
    try {
        if (req.query.userId !== "undefined") {
            const user = await User.findById(req.query.userId);
            const bulkCart = await new Bulkcart(user.bulkCart[0] || {})
            await bulkCart.add(req.body, req.query.productId)
            await User.findByIdAndUpdate(req.query.userId, { "bulkCart": [bulkCart] })
            res.send(user)

        }
    } catch (error) {
        console.log(error)
    }
})

// GET route to display payment page. Middleware checks for jwt and if not sends url to be stored for redirect after forced login
router.get("/checkout", auth, async(req, res, next) => {
    try {
        const user = await User.findById(req.query.userId);
        let sumTotal = 0;
        if (user.cart[0] !== undefined && user.cart[0].totalPrice > 0) {
            sumTotal += user.cart[0].totalPrice
        }
        if (user.bulkCart[0] !== undefined && user.bulkCart[0].totalPrice > 0) {
            sumTotal += user.bulkCart[0].totalPrice
        }
        res.send({sumTotal})
    } catch (error) {
        console.error(error)
    }
})
// POST route to make payment. on success, revert cart and bulkcart to empty objects and make axios call to save order
router.post("/checkout/:id", async (req, res, next) => {
    try {
    let user = await User.findById(req.params.id);
    // Some third party payment code goes here
    let cartArr = [];
    let sumTotal = 0;
    let orderCart = {}
    if (user.cart[0] !== undefined && user.cart[0].totalPrice > 0) {
        cartArr = Object.values(user.cart[0].items)
        sumTotal += user.cart[0].totalPrice
    }
    if (user.bulkCart[0] !== undefined && user.bulkCart[0].totalPrice > 0) {
        cartArr = cartArr.concat(Object.values(user.bulkCart[0].items))
        sumTotal += user.bulkCart[0].totalPrice
    }

    orderCart = {
        userId: `${req.params.id}`,
        name: user.name,
        orderList: cartArr,
        address: req.body.address,
        sumTotal: sumTotal
        // paymentId: stripe.paymentId to be modified depending on third party payment integration
    }
    const savedOrder = await axios.post(`http://localhost:4000/orders/create`, orderCart)
    user.pendingOrders = user.pendingOrders.concat(savedOrder.data);
    await User.findByIdAndUpdate(req.params.id, { "bulkCart": [{}] })
    await User.findByIdAndUpdate(req.params.id, { "cart": [{}] })
    await user.save()
    } catch (error) {
        console.error(error)
    }
})

router.get("/bulkshare/:id", auth, async (req, res, next) => {
    try {
    const productId = req.params.id
    const product = await axios.get(`http://localhost:5000/products/${productId}`)
    res.send(product.data)
    } catch (error) {
        console.error(error)
    }
})
router.get("/bulkshare/checkout/:userId/:productId", async (req, res, next) => {

    // const productId = req.params.productId
    // const product = await axios.get(`http://localhost:5000/products/:${productId}`)
    res.send({
        productId: req.params.productId,
        numberOfParticipants: req.query.numberOfParticipants,
        numberOfParts: req.query.numberOfParts,
        totalAmountToBePaid: req.query.totalAmountToBePaid
    })
})
router.post("/bulkshare/checkout/:userId/:productId", async (req, res, next) => {
    try {
    // Some third party payment code goes here
    const user = await User.findById(req.params.userId)
    const product = await axios.get(`http://localhost:5000/products/${req.params.productId}`)
    const bulkShare = {
        email: user.email,
        product: product.data,
        totalParticipants: req.body.totalParticipants,
        currentParticipants: req.body.currentParticipants,
        participants: [req.params.userId],
        owner: user
    }
    const newBulkShare = await axios.post(`http://localhost:8000/bulkshare/create`, bulkShare)
    user.myBulkShares = user.myBulkShares.concat(newBulkShare.data)
    await user.save()
    } catch (error) {
        console.error(error)
    }
})



module.exports = router