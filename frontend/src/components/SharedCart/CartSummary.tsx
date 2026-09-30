import React from 'react';
import { Tag, Sparkles } from 'lucide-react';
import type { CartItem, DiscountOffer } from '../../types/dealRoom';

interface CartSummaryProps {
  items: CartItem[];
  activeOffer: DiscountOffer | null;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  items,
  activeOffer,
}) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountAmount =
    activeOffer && subtotal > 0
      ? (subtotal * activeOffer.discount_percentage) / 100
      : 0;

  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="cart-summary">
      <div className="summary-row">
        <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
        <span className="summary-val">${subtotal.toFixed(2)}</span>
      </div>

      {activeOffer && discountAmount > 0 && (
        <div className="summary-row discount-row">
          <span className="discount-label">
            <Tag size={13} />
            Offer ({activeOffer.code} -{activeOffer.discount_percentage}%)
          </span>
          <span className="discount-val">-${discountAmount.toFixed(2)}</span>
        </div>
      )}

      <div className="summary-divider" />

      <div className="summary-row total-row">
        <div>
          <span className="total-label">Total</span>
          {activeOffer && (
            <span className="savings-badge">
              <Sparkles size={11} /> Saved ${discountAmount.toFixed(2)}
            </span>
          )}
        </div>
        <span className="total-val">${total.toFixed(2)}</span>
      </div>
    </div>
  );
};
