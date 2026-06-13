import mongoose from 'mongoose';

// models/Cart.js
const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [{
    variantId: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }]
});

export default mongoose.model('Cart', cartSchema);