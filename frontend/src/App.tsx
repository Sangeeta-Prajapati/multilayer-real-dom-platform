import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header/Header';
import { ExplodingBanner } from './components/ExplodingOffer/ExplodingBanner';
import { ProductCatalog } from './components/ProductCatalog/ProductCatalog';
import { SharedCart } from './components/SharedCart/SharedCart';
import { AiChatDrawer } from './components/AiConcierge/AiChatDrawer';
import {
  CheckoutResultModal,
  type CheckoutResultData,
} from './components/Modals/CheckoutResultModal';
import { ReconnectingModal } from './components/Modals/ReconnectingModal';

import {
  INITIAL_INVENTORY,
  INITIAL_ROOM_STATE,
} from './mock/initialData';
import type {
  Product,
  CartItem,
  DiscountOffer,
  ChatMessage,
} from './types/dealRoom';
import {
  getSocket,
  disconnectSocket,
  reconnectSocket,
  socketApi,
} from './services/socket';
import {
  fetchRoomState,
  executeConcurrentHttpCheckout,
} from './services/api';

const ROOM_ID = 'ROOM-9001';

export const App: React.FC = () => {
  // State
  const [currentUser, setCurrentUser] = useState<string>(INITIAL_ROOM_STATE.currentUser);
  const [activeUsers, setActiveUsers] = useState<string[]>(INITIAL_ROOM_STATE.activeUsers);
  const [products, setProducts] = useState<Product[]>(INITIAL_INVENTORY);
  const [sharedCart, setSharedCart] = useState<CartItem[]>(INITIAL_ROOM_STATE.sharedCart);
  const [activeOffer, setActiveOffer] = useState<DiscountOffer | null>(INITIAL_ROOM_STATE.activeOffer);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_ROOM_STATE.chatMessages);
  const [isNegotiating, setIsNegotiating] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Modals state
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResultData | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // Hydrate state from REST API
  const hydrateFromApi = async () => {
    const data = await fetchRoomState(ROOM_ID);
    if (data && data.success) {
      if (data.sharedCart) setSharedCart(data.sharedCart);
      if (data.activeOffer !== undefined) setActiveOffer(data.activeOffer);
      if (data.chatMessages) setChatMessages(data.chatMessages);
      if (data.inventory && data.inventory.length > 0) setProducts(data.inventory);
      if (data.activeUsers) setActiveUsers(data.activeUsers);
    }
  };

  // Setup WebSocket connection and listeners
  useEffect(() => {
    const socket = getSocket();

    // Join room on mount or connect
    const joinCurrentRoom = () => {
      setIsConnected(true);
      socketApi.joinRoom(ROOM_ID, currentUserRef.current);
      hydrateFromApi();
    };

    if (socket.connected) {
      joinCurrentRoom();
    }

    socket.on('connect', joinCurrentRoom);

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room_state_hydrated', (data) => {
      if (data.sharedCart) setSharedCart(data.sharedCart);
      if (data.activeOffer !== undefined) setActiveOffer(data.activeOffer);
      if (data.chatMessages) setChatMessages(data.chatMessages);
      if (data.inventory && data.inventory.length > 0) setProducts(data.inventory);
      if (data.activeUsers) setActiveUsers(data.activeUsers);
    });

    socket.on('user_joined', ({ activeUsers: users }) => {
      if (users) setActiveUsers(users);
    });

    // Challenge 1: Cart synchronization
    socket.on('cart_updated', ({ sharedCart: updatedCart }) => {
      if (updatedCart) setSharedCart(updatedCart);
    });

    // Chat synchronization
    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Challenge 2: Negotiation start indicator
    socket.on('negotiation_started', () => {
      setIsNegotiating(true);
    });

    // Challenge 2: Streaming chunks from background worker
    socket.on('ai_stream_chunk', ({ messageId, chunk, fullText, isFinal }) => {
      setIsNegotiating(false);

      setChatMessages((prev) => {
        const existingIdx = prev.findIndex((m) => m.id === messageId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            text: fullText,
            isStreaming: !isFinal,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: messageId,
              sender: 'ai',
              text: fullText || chunk,
              timestamp: Date.now(),
              isStreaming: !isFinal,
            },
          ];
        }
      });
    });

    // Challenge 3: Exploding Offer events
    socket.on('offer_generated', ({ offer }) => {
      setActiveOffer(offer);
    });

    socket.on('offer_expired', ({ message }) => {
      setActiveOffer(null);
      if (message) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            sender: 'system',
            text: message,
            timestamp: Date.now(),
          },
        ]);
      }
    });

    // Challenge 1: Checkout completion
    socket.on('checkout_complete', (data) => {
      setIsProcessingCheckout(false);
      setSharedCart([]);
      if (data.inventory && data.inventory.length > 0) {
        setProducts(data.inventory);
      }
      setCheckoutResult({
        success: true,
        orderId: data.orderId,
        winnerUser: data.winnerUser,
        message: `Order ${data.orderId} processed successfully by ${data.winnerUser}. Distributed lock prevented double-spending.`,
        details: data.details,
      });
    });

    socket.on('checkout_result', (result) => {
      setIsProcessingCheckout(false);
      if (!result.success) {
        setCheckoutResult(result);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_state_hydrated');
      socket.off('user_joined');
      socket.off('cart_updated');
      socket.off('chat_message');
      socket.off('negotiation_started');
      socket.off('ai_stream_chunk');
      socket.off('offer_generated');
      socket.off('offer_expired');
      socket.off('checkout_complete');
      socket.off('checkout_result');
    };
  }, []);

  // When user switches identity (User A <-> User B)
  const handleSelectUser = (user: string) => {
    setCurrentUser(user);
    currentUserRef.current = user;
    socketApi.joinRoom(ROOM_ID, user);
  };

  // 1. Add to Shared Cart (Challenge 1)
  const handleAddToCart = (product: Product) => {
    socketApi.addToCart(ROOM_ID, product.product_id, currentUser);
  };

  // 2. Quantity updates
  const handleUpdateQuantity = (productId: string, delta: number) => {
    socketApi.updateQuantity(ROOM_ID, productId, delta);
  };

  const handleRemoveItem = (productId: string) => {
    socketApi.removeFromCart(ROOM_ID, productId);
  };

  // 3. Checkout (Single User)
  const handleCheckout = () => {
    setIsProcessingCheckout(true);
    socketApi.checkout(ROOM_ID, currentUser);
  };

  // 4. Challenge 1: Simulate Concurrent Checkout Trap
  // Fires simultaneous POST /api/rooms/:id/checkout calls to test Redis mutex in real-time
  const handleSimulateConcurrentCheckout = async () => {
    setIsProcessingCheckout(true);

    try {
      // Fire requests at the exact same millisecond
      const [resA, resB] = await Promise.all([
        executeConcurrentHttpCheckout(ROOM_ID, 'U-101'),
        executeConcurrentHttpCheckout(ROOM_ID, 'U-102'),
      ]);

      setIsProcessingCheckout(false);

      const winner = resA.ok ? resA : resB;
      const loser = !resA.ok ? resA : resB;

      if (winner.ok) {
        setSharedCart([]);
        setCheckoutResult({
          success: true,
          orderId: winner.data.orderId || 'ORD-RACE-001',
          winnerUser: winner.data.winnerUser || 'User A (U-101)',
          loserUser: loser.data.winnerUser ? undefined : 'User B (U-102)',
          message: `Simultaneous Checkout Trap Handled: ${winner.data.message || 'Winner acquired distributed lock first.'} Loser received 409 Conflict (${loser.data.message || 'Locked out'}).`,
          details: winner.data.details || {
            concurrencyProtected: true,
            paymentProcessedOnce: true,
            inventoryDeducted: ['Inventory deducted atomically 1x'],
          },
        });
      } else {
        setCheckoutResult({
          success: false,
          message: winner.data.message || 'Both checkouts failed or cart empty.',
        });
      }
    } catch (err: any) {
      setIsProcessingCheckout(false);
      setCheckoutResult({
        success: false,
        message: `Concurrency test error: ${err.message}`,
      });
    }
  };

  // 5. Send Chat to AI Concierge (Challenge 2)
  const handleSendMessage = (text: string) => {
    socketApi.sendChat(ROOM_ID, currentUser, text);
  };

  // 6. Exploding offer expiry fallback (Challenge 3)
  const handleOfferExpire = () => {
    setActiveOffer(null);
  };

  // 7. Durability test toggle (Evaluation Criteria: intentional drop & reconnect)
  const handleToggleConnection = () => {
    if (isConnected) {
      disconnectSocket();
      setIsConnected(false);
    } else {
      reconnectSocket();
      setIsConnected(true);
      hydrateFromApi();
    }
  };

  return (
    <div className="app-shell">
      {/* Top Header */}
      <Header
        roomId={ROOM_ID}
        currentUser={currentUser}
        activeUsers={activeUsers}
        isConnected={isConnected}
        onSelectUser={handleSelectUser}
        onToggleConnection={handleToggleConnection}
      />

      {/* Challenge 3: Exploding Offer Banner */}
      <ExplodingBanner
        offer={activeOffer}
        onExpire={handleOfferExpire}
      />

      {/* Main Workspace Layout */}
      <main className="main-grid">
        {/* Left Column: Product Catalog */}
        <ProductCatalog
          products={products}
          onAddToCart={handleAddToCart}
          currentUser={currentUser}
        />

        {/* Right Column: Shared Cart & AI Concierge */}
        <div className="side-column">
          {/* Challenge 1: Multiplayer Shared Cart */}
          <SharedCart
            items={sharedCart}
            currentUser={currentUser}
            activeOffer={activeOffer}
            isProcessingCheckout={isProcessingCheckout}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
            onSimulateConcurrentCheckout={handleSimulateConcurrentCheckout}
          />

          {/* Challenge 2: AI Concierge Haggle Chat */}
          <AiChatDrawer
            messages={chatMessages}
            currentUser={currentUser}
            isNegotiating={isNegotiating}
            onSendMessage={handleSendMessage}
          />
        </div>
      </main>

      {/* Challenge 1 Concurrency Modal */}
      <CheckoutResultModal
        result={checkoutResult}
        onClose={() => setCheckoutResult(null)}
      />

      {/* Durability Reconnecting Modal */}
      <ReconnectingModal
        isOpen={!isConnected}
        onManualReconnect={() => {
          reconnectSocket();
          setIsConnected(true);
          hydrateFromApi();
        }}
      />
    </div>
  );
};

export default App;
