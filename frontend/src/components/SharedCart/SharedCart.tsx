import React from 'react';
import { ShoppingCart, Users } from 'lucide-react';
import type { CartItem, DiscountOffer } from '../../types/dealRoom';
import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';
import { CheckoutAction } from './CheckoutAction';

interface SharedCartProps {
  items: CartItem[];
  currentUser: string;
  activeOffer: DiscountOffer | null;
  isProcessingCheckout: boolean;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onSimulateConcurrentCheckout: () => void;
}

export const SharedCart: React.FC<SharedCartProps> = ({
  items,
  currentUser,
  activeOffer,
  isProcessingCheckout,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onSimulateConcurrentCheckout,
}) => {
  return (
    <div className="shared-cart-panel">
      <div className="cart-header">
        <div className="cart-header-title">
          <ShoppingCart size={20} />
          <h2>Shared Cart</h2>
        </div>
        <div className="multiplayer-tag">
          <Users size={13} />
          <span>Real-time Sync</span>
        </div>
      </div>

      <div className="cart-content">
        {items.length === 0 ? (
          <div className="cart-empty-state">
            <ShoppingCart size={40} className="empty-cart-icon" />
            <p className="empty-title">Shared cart is empty</p>
            <p className="empty-desc">
              Items added by you or your room partner appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="cart-items-list">
            {items.map((item) => (
              <CartItemRow
                key={item.product_id}
                item={item}
                currentUser={currentUser}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="cart-footer">
          <CartSummary items={items} activeOffer={activeOffer} />
          <CheckoutAction
            itemCount={items.length}
            isProcessing={isProcessingCheckout}
            onCheckout={onCheckout}
            onSimulateConcurrentCheckout={onSimulateConcurrentCheckout}
          />
        </div>
      )}
    </div>
  );
};
