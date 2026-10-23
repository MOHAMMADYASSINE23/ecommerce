'use client';

import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { AiOutlineMinus, AiOutlinePlus, AiOutlineLeft, AiOutlineShopping } from 'react-icons/ai';
import { TiDeleteOutline } from 'react-icons/ti';

import { useStateContext } from '../context/StateContext';
import { urlFor } from '../src/sanity/lib/client';
import getStripe from '../src/sanity/lib/getStripe';

const Card = () => {
    const cartRef = useRef();
    const { totalPrice, totalQuantities, cartItems, setShowCart, toggleCartItemQuantity, onRemove } = useStateContext();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutError, setCheckoutError] = useState("");

    const handleCheckout = async () => {
        if (isCheckingOut || cartItems.length === 0) return;

        setIsCheckingOut(true);
        setCheckoutError("");

        try {
            const stripe = await getStripe();
            if (!stripe) {
                throw new Error("Secure checkout is unavailable right now.");
            }

            const response = await fetch('/api/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cartItems.map(({ _id, quantity }) => ({ _id, quantity }))),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || "Unable to start checkout. Please try again.");
            }
            if (typeof data.id !== "string" || !data.id) {
                throw new Error("Checkout did not return a valid session.");
            }

            const result = await stripe.redirectToCheckout({ sessionId: data.id });
            if (result?.error) throw result.error;
        } catch (error) {
            setCheckoutError(
                error instanceof Error
                    ? error.message
                    : "Unable to start checkout. Please try again.",
            );
        } finally {
            setIsCheckingOut(false);
        }
    }
  
      return (
    <div className="cart-wrapper" ref={cartRef}>
      <div className="cart-container">
        <button
        type="button"
        className="cart-heading"
        onClick={() => setShowCart(false)}>
          <AiOutlineLeft />
          <span className="heading">Your Cart</span>
          <span className="cart-num-items">({totalQuantities} items)</span>
        </button>

        {cartItems.length < 1 && (
            <div className="empty-cart">
                <AiOutlineShopping size={150} />
                <h3>Your shopping bag is empty</h3>
                <Link href="/">
                <button type="button" onClick={() => setShowCart(false)} className='btn'>Continue Shopping</button>
                </Link>
            </div>
        )}

        <div className='product-container'>
            {cartItems.length >= 1 && cartItems.map((item) => (
                <div className="product" key={item._id}>
              <img src={urlFor(item?.image[0]).url()} className="cart-product-image" />
              <div className="item-desc">
                <div className="flex top">
                  <h5>{item.name}</h5>
                  <h4>${item.price}</h4>
                </div>
                <div className="flex bottom">
                  <div>
                  <p className="quantity-desc">
                    <span className="minus" onClick={() => toggleCartItemQuantity(item._id, 'dec') }>
                    <AiOutlineMinus />
                    </span>
                    <span className="num">{item.quantity}</span>
                    <span className="plus" onClick={() => toggleCartItemQuantity(item._id, 'inc') }><AiOutlinePlus /></span>
                  </p>
                  </div>
                  <button type='button' className='remove-item' onClick={() => onRemove(item)}>
                    <TiDeleteOutline />
                   </button>
                  </div>
                 </div>
                </div>
            ))}
       </div>
       {cartItems.length >= 1 && (
          <div className="cart-bottom">
            <div className="total">
              <h3>Subtotal:</h3>
              <h3>${totalPrice}</h3>
            </div>
            <div className="btn-container">
              {checkoutError && <p className="checkout-error" role="alert">{checkoutError}</p>}
              <button type="button" className="btn" onClick={handleCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? "Opening secure checkout..." : "Pay with Stripe"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Card