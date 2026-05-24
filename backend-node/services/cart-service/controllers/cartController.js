import Cart from '../models/Cart.js';

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    // Trả về mặc định { items: [] } nếu chưa có giỏ hàng
    res.status(200).json(cart || { userId: req.user.id, items: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addToCart = async (req, res) => {
  const { variantId, name, price, quantity, image } = req.body;
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });
    
    const idx = cart.items.findIndex(i => i.variantId === variantId);
    if (idx > -1) {
      cart.items[idx].quantity += Number(quantity);
    } else {
      cart.items.push({ variantId, name, price, quantity, image });
    }
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    
    cart.items = cart.items.filter(item => item.variantId !== productId);
    await cart.save();
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const mergeCart = async (req, res) => {
    try {
        const { items } = req.body;
        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

        items.forEach(newItem => {
            const existing = cart.items.find(i => i.variantId === newItem.variantId);
            if (existing) {
                // SỬA Ở ĐÂY: Thay vì cộng dồn vô điều kiện
                // Chúng ta chỉ cộng nếu quantity của newItem > 0
                existing.quantity = Number(existing.quantity) + Number(newItem.quantity);
            } else {
                cart.items.push(newItem);
            }
        });
        
        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};