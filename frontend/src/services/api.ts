const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchRoomState(roomId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}/state`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.warn('[API] fetchRoomState failed:', err.message);
    return null;
  }
}

export async function resetRoomState(roomId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}/reset`, {
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    console.warn('[API] resetRoomState failed:', err.message);
    return null;
  }
}

export async function executeConcurrentHttpCheckout(roomId: string, userId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message } };
  }
}
