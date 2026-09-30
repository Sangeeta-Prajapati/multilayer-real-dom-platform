import React, { useEffect, useState } from 'react';
import { Flame, Clock, Sparkles } from 'lucide-react';
import type { DiscountOffer } from '../../types/dealRoom';

interface ExplodingBannerProps {
  offer: DiscountOffer | null;
  onExpire?: () => void;
}

export const ExplodingBanner: React.FC<ExplodingBannerProps> = ({
  offer,
  onExpire,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  useEffect(() => {
    if (!offer) return;

    const updateTimer = () => {
      const remaining = offer.expires_at - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        if (onExpire) onExpire();
      } else {
        setTimeLeftMs(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [offer, onExpire]);

  if (!offer || timeLeftMs <= 0) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const totalDuration = (offer.duration_seconds || 180) * 1000;
  const percentLeft = Math.min(100, Math.max(0, (timeLeftMs / totalDuration) * 100));

  return (
    <div className="exploding-banner">
      <div className="banner-glow-effect" />
      <div className="banner-content">
        <div className="banner-badge">
          <Flame size={18} className="flame-icon" />
          <span>EXPLODING OFFER</span>
        </div>

        <div className="banner-details">
          <div className="banner-title">
            <strong>{offer.discount_percentage}% OFF BUNDLE DISCOUNT</strong>
            <span className="offer-code">CODE: {offer.code}</span>
          </div>
          <p className="banner-description">
            <Sparkles size={14} className="sparkle-icon" />
            {offer.description} (Backend TTL enforced via Redis)
          </p>
        </div>

        <div className="banner-timer-box">
          <Clock size={16} />
          <div className="timer-values">
            <span className="timer-label">Strict Backend TTL:</span>
            <span className="timer-countdown">{formattedTime}</span>
          </div>
        </div>
      </div>

      <div className="banner-progress-track">
        <div
          className="banner-progress-bar"
          style={{ width: `${percentLeft}%` }}
        />
      </div>
    </div>
  );
};
