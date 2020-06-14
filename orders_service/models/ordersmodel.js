const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ordersSchema = new Schema({
  userId: {
    type: String, 
    required: true 
  },
  orderList: [],
  address: { 
      type: String, 
      // required: true 
    },
  name: { 
      type: String, 
      required: true 
    },
  isPending: { 
      type: Boolean, 
      default: true
    },
  isShipping: { 
      type: Boolean, 
      default: false
    },
  isCompleted: { 
      type: Boolean, 
      default: false
    },
  createdAt: {
    type: Date,
    default: new Date()
  },
  sumTotal: {
    type: Number
  }
});
const Order = mongoose.model("Order", ordersSchema);
module.exports = Order;
