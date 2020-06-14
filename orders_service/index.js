const express = require("express");
const bodyParser = require("body-parser")
const app = express()
const ordersRouter = require("./routers/ordersroute")
const mongoose = require("mongoose")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}));
app.use("/orders", ordersRouter)
mongoose.connect("mongodb://localhost/orderdatabase", { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connection.once("open", ()=>{
  console.log("ORDER database is up")
}).on("error", ()=>{
  console.log("Error connecting to ORDER database")
})
const PORT = process.env.PORT || 4000
app.listen(PORT, ()=>{
  console.log(`Listening on port ${PORT}`)  
})