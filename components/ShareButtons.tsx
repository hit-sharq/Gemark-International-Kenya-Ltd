// Share Buttons Component
'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Link2, X } from 'lucide-react';
import './ShareButtons.css';

interface ShareButtonsProps {
  url?: string;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

// Custom WhatsApp Icon Component
const WhatsAppIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function ShareButtons({
  url = typeof window !== 'undefined' ? window.location.href : '',
  title,
  description = 'Check out this artwork on ArtAfrik!',
  size = 'md',
  showLabels = false,
}: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const sizeClass = `share-${size}`;

  return (
    <div className={`share-buttons ${sizeClass}`}>
      <button
        className="share-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Share"
      >
        <Share2 size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
        {showLabels && <span>Share</span>}
      </button>

      {isOpen && (
        <div className="share-menu">
          <div className="share-header">
            <span>Share this artwork</span>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="share-options">
            <button
              className="share-option facebook"
              onClick={() => handleShare('facebook')}
              aria-label="Share on Facebook"
            >
              <Facebook size={size === 'sm' ? 18 : 22} />
              <span>Facebook</span>
            </button>

            <button
              className="share-option twitter"
              onClick={() => handleShare('twitter')}
              aria-label="Share on Twitter"
            >
              <Twitter size={size === 'sm' ? 18 : 22} />
              <span>Twitter</span>
            </button>

            <button
              className="share-option whatsapp"
              onClick={() => handleShare('whatsapp')}
              aria-label="Share on WhatsApp"
            >
              <WhatsAppIcon size={size === 'sm' ? 18 : 22} />
              <span>WhatsApp</span>
            </button>

            <button
              className="share-option copy"
              onClick={handleCopyLink}
              aria-label="Copy link"
            >
              {copied ? (
                <>
                  <span className="check-icon">✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Link2 size={size === 'sm' ? 18 : 22} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

