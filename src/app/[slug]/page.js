'use client';

import React, { useState, useEffect, use } from 'react';
import { AiOutlineMinus, AiOutlinePlus, AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { urlFor } from '../../../src/sanity/lib/client';
import { Product } from '../../../components';
import { useStateContext } from '../../../context/StateContext';

const ProductDetails = ({ params }) => {
  const { slug } = use(params);
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const { decQty, incQty, qty, onAdd, setShowCart } = useStateContext();

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProductData() {
      setError('');
      setProduct(null);

      try {
        const response = await fetch('/api/products/' + encodeURIComponent(slug), {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load this product.');
        }

        setProduct(data.product);
        setProducts(Array.isArray(data.products) ? data.products : []);
        setIndex(0);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load this product.');
        }
      }
    }

    fetchProductData();
    return () => controller.abort();
  }, [slug]);

  if (error) return <div className="product-load-error" role="alert">{error}</div>;
  if (!product) return <div role="status">Loading product...</div>;

  const { image, name, details, price } = product;

  const handleBuyNow = () => {
    onAdd(product, qty);
    setShowCart(true);
  };

  const handleAddToCart = () => {
    onAdd(product, qty);
    setShowCart(true);
  };

  return (
    <div>
      <div className="product-detail-container">
        <div>
          <div className="image-container">
            <img
              src={urlFor(image && image[index]).url()}
              className="product-detail-image"
              alt={name || "Product"}
            />
          </div>
          <div className="small-images-container">
            {image?.map((item, i) => (
              <button
                type="button"
                key={item.asset?._ref || i}
                aria-label={`View image ${i + 1} of ${name}`}
                className={i === index ? 'small-image selected-image' : 'small-image'}
                onMouseEnter={() => setIndex(i)}
                onFocus={() => setIndex(i)}
              >
                <img src={urlFor(item).url()} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail-desc">
          <h1>{name}</h1>
          <div className="reviews">
            <div aria-label="4 out of 5 stars">
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
              <AiFillStar />
              <AiOutlineStar />
            </div>
            <p>Demo rating</p>
          </div>
          <h4>Details:</h4>
          <p>{details}</p>
          <p className="price">${Number(price).toFixed(2)}</p>
          <div className="quantity">
            <h3>Quantity:</h3>
            <p className="quantity-desc">
              <button type="button" className="minus" onClick={decQty} aria-label="Decrease quantity"><AiOutlineMinus /></button>
              <span className="num">{qty}</span>
              <button type="button" className="plus" onClick={incQty} aria-label="Increase quantity"><AiOutlinePlus /></button>
            </p>
          </div>
          <div className="buttons">
            <button type="button" className="add-to-cart" onClick={handleAddToCart}>Add to Cart</button>
            <button type="button" className="buy-now" onClick={handleBuyNow}>Buy Now</button>
          </div>
        </div>
      </div>

      <div className="maylike-products-wrapper">
        <h2>You may also like</h2>
        <div className="marquee">
          <div className="maylike-products-container track">
            {products.filter((item) => item._id !== product._id).map((item) => (
              <Product key={item._id} product={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
