// Related Products Component
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import AddToCartButton from './AddToCartButton';
import WishlistButton from './WishlistButton';
import { ArtListingType } from '@/types';
import './RelatedProducts.css';

interface RelatedProductsProps {
  currentArtId: string;
  categoryId: string;
  limit?: number;
}

export default function RelatedProducts({
  currentArtId,
  categoryId,
  limit = 4,
}: RelatedProductsProps) {
  const [relatedArt, setRelatedArt] = useState<ArtListingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedArt = async () => {
      try {
        const response = await fetch(
          `/api/art-listings?categoryId=${categoryId}&excludeId=${currentArtId}&featured=true&limit=${limit}`
        );
        const data = await response.json();

        if (data.success) {
          setRelatedArt(data.data.artListings);
        }
      } catch (error) {
        console.error('Error fetching related art:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedArt();
  }, [currentArtId, categoryId, limit]);

  if (isLoading) {
    return (
      <div className="related-products">
        <div className="section-header">
          <h3>You May Also Like</h3>
        </div>
        <div className="related-grid loading">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="related-card-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-text" />
              <div className="skeleton-text short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedArt.length === 0) {
    return null;
  }

  return (
    <div className="related-products">
      <div className="section-header">
        <h3>You May Also Like</h3>
        <Link href="/gallery" className="view-all-link">
          View All <ArrowRight size={16} />
        </Link>
      </div>

      <div className="related-grid">
        {relatedArt.map((art) => (
          <Link
            key={art.id}
            href={`/gallery/${art.id}`}
            className="related-card"
          >
            <div className="card-image">
              <Image
                src={art.images[0] || '/placeholder.jpg'}
                alt={art.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                style={{ objectFit: 'cover' }}
              />
              <div className="card-overlay">
                <AddToCartButton artwork={art} variant="icon-only" />
                <WishlistButton artwork={art} size="sm" />
              </div>
              {art.category && (
                <span className="category-badge">{art.category.name}</span>
              )}
            </div>
            <div className="card-content">
              <h4 className="card-title">{art.title}</h4>
              <div className="card-meta">
                <span className="card-region">{art.region}</span>
                <span className="card-price">
                  ${art.price.toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

