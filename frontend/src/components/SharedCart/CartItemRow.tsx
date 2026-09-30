import React from 'react';
import { Trash2, Plus, Minus, UserCheck } from 'lucide-react';
import type { CartItem } from '../../types/dealRoom';

interface CartItemRowProps {
  item: CartItem;
  currentUser: string;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const isAddedByMe = item.added_by === currentUser;
  const adderAlias = item.added_by === 'U-101' ? 'User A' : item.added_by === 'U-102' ? 'User B' : item.added_by;

  return (
    <div className="cart-item-row">
      <div className="cart-item-main">
        <div className="item-title-line">
          <h4 className="item-name">{item.name}</h4>
          <span className={`adder-tag ${isAddedByMe ? 'by-me' : 'by-peer'}`}>
            <UserCheck size={11} />
            {isAddedByMe ? 'Added by You' : `Added by ${adderAlias}`}
          </span>
        </div>
        <div className="item-unit-price">${item.price.toFixed(2)} each</div>
      </div>

      <div className="cart-item-actions">
        <div className="quantity-controls">
          <button
            type="button"
            className="qty-btn"
            onClick={() => onUpdateQuantity(item.product_id, -1)}
            disabled={item.quantity <= 1}
            title="Decrease quantity"
          >
            <Minus size={12} />
          </button>
          <span className="qty-value">{item.quantity}</span>
          <button
            type="button"
            className="qty-btn"
            onClick={() => onUpdateQuantity(item.product_id, 1)}
            title="Increase quantity"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="item-line-total">
          ${(item.price * item.quantity).toFixed(2)}
        </div>

        <button
          type="button"
          className="remove-btn"
          onClick={() => onRemoveItem(item.product_id)}
          title="Remove from shared cart"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
