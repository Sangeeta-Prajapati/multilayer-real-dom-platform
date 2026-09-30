import React from 'react';
import { CheckCircle2, AlertOctagon, X, ShieldCheck } from 'lucide-react';

export interface CheckoutResultData {
  success: boolean;
  orderId?: string;
  winnerUser?: string;
  loserUser?: string;
  message: string;
  details?: {
    inventoryDeducted: string[];
    paymentProcessedOnce: boolean;
    concurrencyProtected: boolean;
  };
}

interface CheckoutResultModalProps {
  result: CheckoutResultData | null;
  onClose: () => void;
}

export const CheckoutResultModal: React.FC<CheckoutResultModalProps> = ({
  result,
  onClose,
}) => {
  if (!result) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button type="button" className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-icon-wrap">
          {result.success ? (
            <div className="icon-success">
              <CheckCircle2 size={44} />
            </div>
          ) : (
            <div className="icon-conflict">
              <AlertOctagon size={44} />
            </div>
          )}
        </div>

        <h3 className="modal-title">
          {result.success
            ? 'Checkout Succeeded'
            : 'Race Condition Blocked'}
        </h3>

        <p className="modal-message">{result.message}</p>

        {result.details && (
          <div className="concurrency-audit-box">
            <div className="audit-header">
              <ShieldCheck size={14} />
              <span>Challenge 1: Concurrency Trap Audit</span>
            </div>
            <ul className="audit-list">
              <li>
                <strong>Atomic Transaction:</strong>{' '}
                {result.details.concurrencyProtected ? 'Verified (Distributed Lock)' : 'None'}
              </li>
              <li>
                <strong>Payment Executed:</strong>{' '}
                {result.details.paymentProcessedOnce ? 'Exactly 1x (No Double Charge)' : 'Multiple'}
              </li>
              <li>
                <strong>Inventory Deduction:</strong>{' '}
                {result.details.inventoryDeducted.join(', ')}
              </li>
            </ul>
          </div>
        )}

        <button type="button" className="modal-action-btn" onClick={onClose}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
