import React from 'react';
import { CreditCard, Zap, ShieldAlert } from 'lucide-react';

interface CheckoutActionProps {
  itemCount: number;
  isProcessing: boolean;
  onCheckout: () => void;
  onSimulateConcurrentCheckout: () => void;
}

export const CheckoutAction: React.FC<CheckoutActionProps> = ({
  itemCount,
  isProcessing,
  onCheckout,
  onSimulateConcurrentCheckout,
}) => {
  const isDisabled = itemCount === 0 || isProcessing;

  return (
    <div className="checkout-action-container">
      <button
        type="button"
        className="primary-checkout-btn"
        disabled={isDisabled}
        onClick={onCheckout}
      >
        <CreditCard size={18} />
        <span>{isProcessing ? 'Processing Transaction...' : 'Checkout Shared Cart'}</span>
      </button>

      <div className="concurrency-test-box">
        <div className="concurrency-label">
          <ShieldAlert size={14} className="shield-icon" />
          <span>Challenge 1: Concurrency Trap Test</span>
        </div>
        <button
          type="button"
          className="concurrent-test-btn"
          disabled={isDisabled}
          onClick={onSimulateConcurrentCheckout}
          title="Fires 2 simultaneous checkouts for User A & User B at the exact same millisecond"
        >
          <Zap size={14} />
          <span>Simulate User A & B Simultaneous Checkout</span>
        </button>
      </div>
    </div>
  );
};
