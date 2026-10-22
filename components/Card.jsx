'use client';

import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { AiOutlineMinus, AiOutlinePlus, AiOutlineLeft, AiOutlineShopping } from 'react-icons/ai';
import { TiDeleteOutline } from 'react-icons/ti';

import { useStateContext } from '../context/StateContext';
import { urlFor } from '../src/sanity/lib/client';

const Card = () => {
    const cartRef = useRef();
    const [checkoutError, setCheckoutError] = useState('');
    const { totalPrice, totalQuantities, cartItems, setShowCart, toggleCartItemQuantity, onRemove } = useStateContext();

    const handleCheckout = async () => {
        setCheckoutError('');

        try {
            const response = await fetch('/api/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cartItems),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || 'Unable to start checkout. Please try again.');
            }
            if (typeof data.url !== 'string') {
                throw new Error('Checkout did not return a payment URL.');
            }

            const checkoutUrl = new URL(data.url);
            if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.stripe.com') {
                throw new Error('Checkout returned an invalid payment URL.');
            }

            window.location.assign(checkoutUrl.toString());
        } catch (error) {
            setCheckoutError(error instanceof Error ? error.message : 'Unable to start checkout. Please try again.');
        }
    };
  
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
              <button type="button" className="btn" onClick={handleCheckout}>
                Pay with Stripe
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Card