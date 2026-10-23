import React from 'react';
import Link from 'next/link';

const Canceled = () => {
  return (
    <div className="cancel-wrapper">
      <div className="cancel">
        <p className="icon">❌</p>
        <h2>Your order was canceled</h2>
        <p className="description">
          Continue to shop around and checkout when you&apos;re ready.
        </p>
        <Link href="/">
          <button type="button" width="300px" className="btn">
            Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Canceled;