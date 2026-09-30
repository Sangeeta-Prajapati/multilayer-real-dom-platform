export interface AiHaggleResult {
  responseText: string;
  generateOffer: boolean;
  offerDetails?: {
    code: string;
    description: string;
    discountPercentage: number;
    requiredProductIds: string[];
    durationSeconds: number;
  };
}

export function evaluateNegotiation(message: string): AiHaggleResult {
  const lower = message.toLowerCase();

  // Keyword: "laptop" (matches Challenge 2 in README: "If we buy two laptops, can we get a discount?")
  if (lower.includes('laptop')) {
    return {
      responseText:
        "AI Sales Concierge: I checked inventory with our manager! Because you are shopping together, I've unlocked an exclusive 20% bundle discount code [BUNDLE20] for Titanium Pro Laptops. Complete checkout within the next 3 minutes before the allocation closes!",
      generateOffer: true,
      offerDetails: {
        code: 'BUNDLE20',
        description: '20% off bundle deal on Titanium Pro Laptop & peripherals',
        discountPercentage: 20,
        requiredProductIds: ['PRD-01'],
        durationSeconds: 180, // strictly 3 minutes
      },
    };
  }

  // Keyword: "mouse" or "monitor"
  if (lower.includes('monitor') || lower.includes('mouse')) {
    return {
      responseText:
        "AI Sales Concierge: Great choice! I can authorize a 15% discount [ACC15] on monitors and accessories for your shared cart, strictly valid for 3 minutes!",
      generateOffer: true,
      offerDetails: {
        code: 'ACC15',
        description: '15% discount on accessories and display hardware',
        discountPercentage: 15,
        requiredProductIds: ['PRD-02', 'PRD-03'],
        durationSeconds: 180,
      },
    };
  }

  // Default response
  return {
    responseText:
      "AI Sales Concierge: I reviewed your negotiation request. I am pleased to offer a 10% co-shopping incentive [DEAL10] valid for the next 3 minutes!",
    generateOffer: true,
    offerDetails: {
      code: 'DEAL10',
      description: '10% co-shopping welcome discount',
      discountPercentage: 10,
      requiredProductIds: [],
      durationSeconds: 180,
    },
  };
}
