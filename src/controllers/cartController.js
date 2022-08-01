const mongoose = require('mongoose')
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')


/*############################################ Validations #####################################################*/

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (data) {
    return Object.keys(data).length > 0;
};


/*########################################## 10. create Cart ####################################################*/

const createCart = async function (req, res) {
    try {
        const data = req.body
        const userId = req.params.userId
        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: ' Post Body is empty, Please add some key-value pairs' })
        }
        let { productId, quantity, cartId } = data

        // if quantity does't exist then add 1 default
        if (!isValid(productId)) {
            return res.status(400).send({ status: false, message: ' ProductId must be required!' })
        }
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: ' ProductId must be a valiod ObjectId !' })
        }
        if (isNaN(quantity) || (quantity < 1)) {
            return res.status(400).send({ status: false, message: ' Quantity must be in Number and greater than 0 !' })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: " productId not found!" })
        }
        // check if the cart is already exist or not
        const cart = await cartModel.findOne({ userId })
        if (cart) {

            if (!isValid(cartId)) {
                return res.status(400).send({ status: false, message: " CartId of this user must be required!" })
            }
            if (!mongoose.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: " Invalid cartId !" })
            }
            if (cart._id != cartId) {
                return res.status(400).send({ status: false, message: " CartId doesn't belong to this user!" })
            }
            // check both cartid's from req.body and db cart are match or not?

            // we neeed to check if the item already exist in my item's list or NOT!!
            let index = -1;
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    index = i
                    break
                }
            }

            // now we need to add item
            if (index >= 0) {
                cart.items[index].quantity = cart.items[index].quantity + quantity
            }
            else {
                cart.items.push({ productId, quantity }) //push the another item added and will be added in total item
            }
            cart.totalPrice = cart.totalPrice + (product.price * quantity)
            cart.totalItems = cart.items.length
            await cart.save()

            return res.status(200).send({ status: true, message: " Item added successfully and Cart updated!", data: cart })
        }

        //creating cart here
        const object = {
            userId,
            items: [{ productId, quantity }],
            totalPrice: product.price * quantity,
            totalItems: 1
        }

        const createCart = await cartModel.create(object)
        return res.status(201).send({ status: true, message: ' Item added successfully and New cart created!', data: createCart })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}




/*########################################## 12. Get Cart ####################################################*/


const getCart = async function (req, res) {
    try {
        let userId = req.params.userId

        //----------------------------- Getting cart Detail -----------------------------//
        const cart = await cartModel.findOne({ userId: userId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }
        res.status(200).send({ status: true, message: "Find your cart details below: ", data: cart });
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}



/*########################################## 13. Delete Cart ####################################################*/


const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId

        //----------------------------- Deleting cart  -----------------------------//
        const cart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalItems: 0, totalPrice: 0 }, { new: true })

        if (!cart) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }
        return res.status(204).send({ status: true, message: "deleted successfully", data: cart })
    } 
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports = { getCart, createCart, deleteCart }