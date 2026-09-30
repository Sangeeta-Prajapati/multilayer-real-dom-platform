import React from 'react';
import { Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Product } from '../../types/dealRoom';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  currentUser?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
}) => {
  const isLowStock = product.stock_quantity === 1;
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className={`product-card ${isLowStock ? 'border-warning' : ''}`}>
      <div className="product-card-header">
        <span className="product-id-tag">{product.product_id}</span>
        <span
          className={`stock-badge ${
            isOutOfStock ? 'out-of-stock' : isLowStock ? 'critical-stock' : 'in-stock'
          }`}
        >
          {isLowStock ? (
            <>
              <AlertTriangle size={13} /> Only 1 Left (Race Trap Target)
            </>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              <CheckCircle2 size={13} /> {product.stock_quantity} in stock
            </>
          )}
        </span>
      </div>

      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
      </div>

      <div className="product-card-footer">
        <div className="price-tag">
          <span className="currency">$</span>
          <span className="amount">{product.base_price.toFixed(2)}</span>
        </div>

        <button
          type="button"
          className="add-to-cart-btn"
          disabled={isOutOfStock}
          onClick={() => onAddToCart(product)}
        >
          <Plus size={16} />
          <span>Add to Shared Cart</span>
        </button>
      </div>
    </div>
  );
};
