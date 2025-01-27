"use strict";
const { cart } = require("../models/cart.model");
const { model, Schema, Types } = require("mongoose"); // Ensure Types is imported
const { product1 } = require("../models/product.model");
const ProductService = require("./product.service");

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
    const { product_id, quantity, price, type } =
      product.product === undefined ? product : product.product;
    console.log(product_id, quantity, price);
    const query = {
      cart_userId: userId,
      "cart_products.product_id": product_id,
    };

    const existingCart = await cart.findOne(query);

    if (existingCart) {
      const updateSet =
        type === 1
          ? {
              $set: {
                "cart_products.$.quantity": quantity,
              },
            }
          : {
              $inc: {
                "cart_products.$.quantity": quantity,
              },
            };
      const options = { upsert: true, new: true };
      return await cart.findOneAndUpdate(query, updateSet, options);
    } else {
      const updateSet = {
        $push: {
          cart_products: {
            product_id: product_id,
            quantity: quantity,
            price: price,
          },
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
  static async addToCart(userId, product) {
    console.log("add to cart", userId, product);
    if (product.quantity <= 0) {
      return { message: "Quantity must be greater than 0" };
    }
    const product2 = await ProductService.getProductById(product.product_id);
    console.log(product.product_id);
    console.log(product2);
    if (product2.product_quantity < product.quantity) {
      return { message: "Product out of stock" };
    }
    //Nếu cart chưa có thì tạo và chèn product đó vào
    const userCart = await cart.findOne({ cart_userId: userId });
    if (!userCart) return await CartService.createUserCart(userId, product);
    //nếu có cart rồi mà rỗng thì chèn thêm product vào
    if (!userCart.cart_products.length) {
      userCart.cart_products = [product];
    }
    return await CartService.updateUserCartQuantity(userId, product);
  }
  static async removeProduct(userId, productId) {
    console.log("remove product", userId, productId);
    const query = { cart_userId: userId },
      updateSet = {
        $pull: {
          cart_products: { product_id: productId },
        },
      };
    const deleteProduct = await cart.updateOne(query, updateSet);
    return deleteProduct;
  }
  static async clearUserCart(userId) {
    console.log("clear user cart", userId);
    const query = { cart_userId: userId };
    const updateSet = {
      $set: {
        cart_products: [],
      },
    };
    return await cart.updateOne(query, updateSet);
  }

  static async getUserCart(userId) {
    console.log("get user cart", userId);
    const userCart = await cart.findOne({ cart_userId: userId }).lean();
    if (!userCart) return [];
    const productIds = userCart.cart_products.map((item) => item.product_id);
    const products = await product1.find({ _id: { $in: productIds } }).lean();

    // Merge product details with cart items
    userCart.cart_products = userCart.cart_products.map((cartItem) => {
      const productDetails = products.find(
        (p) => p._id.toString() === cartItem.product_id.toString()
      );
      console.log(productDetails);
      return {
        ...cartItem,
        name: productDetails.product_name,
        image: productDetails.product_thumb,
        quantity: Math.min(cartItem.quantity, productDetails.product_quantity),
      };
    });
    return userCart.cart_products;
  }
  static async getCartProductsSize(userId) {
    if (!userId || userId == undefined) {
      return 0;
    }
    const userCart = await cart.findOne({ cart_userId: userId });
    if (!userCart) {
      return 0;
    }
    return userCart.cart_products.length;
  }
}
module.exports = CartService;
