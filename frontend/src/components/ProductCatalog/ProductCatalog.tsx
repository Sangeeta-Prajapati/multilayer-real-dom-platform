import React from 'react';
import { Package } from 'lucide-react';
import type { Product } from '../../types/dealRoom';
import { ProductCard } from './ProductCard';

interface ProductCatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  currentUser: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onAddToCart,
  currentUser,
}) => {
  return (
    <section className="catalog-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <Package className="section-icon" size={20} />
          <h2>Available Inventory</h2>
        </div>
        <span className="section-subtitle">
          Synced across all shoppers in real-time
        </span>
      </div>

      <div className="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.product_id}
            product={product}
            onAddToCart={onAddToCart}
            currentUser={currentUser}
          />
        ))}
      </div>
    </section>
  );
};
