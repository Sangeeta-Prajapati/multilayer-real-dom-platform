# Assessment: Multiplayer "AI Deal Room" (Co-Shopping Platform)

## 1. Application Overview
Standard e-commerce is a solitary experience. You are building a **Synchronized Co-Shopping Platform** where a user can invite a friend to a private "Deal Room." 

Inside this room, both users share a single, synchronized shopping cart. The room also contains an "AI Sales Concierge." Users can ask the AI questions about products, and the AI can dynamically generate temporary, bundled discount codes if they add specific items to their shared cart.

## 2. Tech Stack Parameters
Select any modern framework. The architecture must strictly implement the following:
*   **Frontend:** A modern SPA (React/Next.js) with global state management.
*   **Backend / Microservices:** An API Gateway AND a decoupled asynchronous background worker.
*   **Infrastructure:** A Database, a Message Queue / Cache (e.g., Redis), and a WebSocket server.
*   **DevOps:** Docker containerization (must execute via `docker-compose`).

## 3. Architectural Requirements

**Challenge 1: The Multiplayer Shared Cart (State Synchronization)**
*   User A and User B are in the same socket room. If User A clicks "Add to Cart," User B's screen must instantly reflect the updated cart via WebSockets.
*   **The Concurrency Trap:** If User A and User B click "Checkout" at the exact same millisecond for the shared cart, your system must execute an atomic transaction. It must process the payment once, deduct the inventory once, and broadcast a `Checkout_Complete` event to both screens.

**Challenge 2: The "Haggle" Engine (Worker Offloading & Streaming)**
*   Users can chat with the AI (e.g., "If we buy two laptops, can we get a discount?"). 
*   The main API must NOT process this request. It must push the chat payload to a Redis queue. 
*   The background worker consumes the job, simulates a 10-second "AI Negotiation" delay, and streams the response back to both users in the room simultaneously.

**Challenge 3: The Exploding Offer (Distributed TTL)**
*   The mocked AI will occasionally offer a "Custom Bundle Discount" (e.g., 20% off) that is strictly valid for **3 minutes**.
*   **The Trap:** You cannot rely on a frontend JavaScript timer. A user could alter their system clock or manipulate the frontend state to freeze the timer. The expiration must be enforced by the backend (e.g., via Redis TTL or a worker cron job). When the 3 minutes expire, the backend must autonomously forcefully remove the discount from the shared cart and broadcast an `Offer_Expired` event to the room.

## 4. Evaluation Criteria
*   **No Paid APIs:** Mock the AI negotiation logic (return hardcoded, streamed string responses based on keywords like "laptop").
*   **Containerization:** `docker-compose up` must initialize the entire distributed architecture.
*   **Durability:** We will intentionally drop the WebSocket connection mid-session. The frontend must seamlessly reconnect and hydrate the current cart/chat state from the backend.

## 5. Submission Protocol
1.  **Public GitHub Repository:** Source code and `docker-compose.yml`.
2.  **Live Deployment URL:** Hosted, functional frontend and API.