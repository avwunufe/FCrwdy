const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const productsSchema = new Schema({
   // imagePath: {type: String, required: true},
   // bulkImagePath: {type: String, required: true},
   title: {type: String, required: true},
   bulkTitle: {type: String, required: true},
   category: {type: String, reuired: true},
   description: {type: String, required: true},
   bulkDescription: {type: String, required: true},
   price: {type: Number, required: true},
   bulkPrice: {type: Number, required: true},
   reviews: [],
   rating: {
      type: Number
   }
})

const Product = mongoose.model("Product", productsSchema)
module.exports = Product