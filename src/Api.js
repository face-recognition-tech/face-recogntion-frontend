import { API_URL } from './config';

export async function listFaces() {
  const res = await fetch(`${API_URL}/faces`);
  if (!res.ok) throw new Error('Failed to fetch faces');
  return res.json();
}

export async function registerFace({ name, descriptor, image_base64 }) {
  const res = await fetch(`${API_URL}/faces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, descriptor, image_base64 })
  });
  if (!res.ok) throw new Error('Failed to register face');
  return res.json();
}

export async function deleteFace(id) {
  const res = await fetch(`${API_URL}/faces/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete face');
  return res.json();
}
