"use strict";
const { cart } = require("../models/cart.model");
const { model, Schema, Types } = require("mongoose"); // Ensure Types is imported

class CartService {
  static async createUserCart(userId, product) {
    console.log("creat", userId, product);
    const query = { cart_userId: userId },
      updateOrInsert = {
        $addToSet: {
          cart_products: product,
        },
      },
      option = { upsert: true, new: true };
    return await cart.findOneAndUpdate(query, updateOrInsert, option);
  }
  static async updateUserCartQuantity(userId, product) {
    console.log("updateUserCartQuantity: =========", product);
    const { product_id, quantity, price } = product;
    console.log(product_id, quantity )
    const query = {
      cart_userId: userId,
      "cart_products.product_id": product_id,
    };

    const existingCart = await cart.findOne(query);

    if (existingCart) {
      const updateSet = {
        $inc: {
          "cart_products.$.quantity": quantity,
        },
      };
      const options = { upsert: true, new: true };
      return await cart.findOneAndUpdate(query, updateSet, options);
    } else {
      const updateSet = {
        $push: {
          cart_products: { product_id: product_id, quantity: quantity, price: price},
        },
      };
      const options = { upsert: true, new: true };
      return await cart.findOneAndUpdate(
        { cart_userId: userId },
        updateSet,
        options
      );
    }
  }
  static async addToCart({ userId, product = {} }) {
    console.log("add to cart", userId, product);
    //Nếu cart chưa có thì tạo và chèn product đó vào
    const userCart = await cart.findOne({ cart_userId: userId });
    if (!userCart) return await CartService.createUserCart(userId, product);
    //nếu có cart rồi mà rỗng thì chèn thêm product vào
    if (!userCart.cart_products.length) {
      userCart.cart_products = [product];
    }
    return await CartService.updateUserCartQuantity(userId, product);
  }
  static async modifyQuantity({ userId, product }) {
    const { productId, quantity } = product;
    if (quantity == 0) {
      return await CartService.removeProduct(userId, product);
    }
    return await CartService.updateUserCartQuantity(userId, product);
  }
  static async removeProduct({ userId, productId }) {
    console.log("remove product", userId, productId);
    const query = { cart_userId: userId },
      updateSet = {
        $pull: {
          cart_products: { productId },
        },
      };
    const deleteProduct = await cart.updateOne(query, updateSet);
    return deleteProduct;
  }
  static async getUserCart({ userId }) {
    console.log("get user cart", userId);
    return await cart.findOne({ cart_userId: userId }).lean();
  }
}
module.exports = CartService;