import { queryOptions } from '@tanstack/react-query'
import type { Cart } from '@/contracts/marketplace'
import { http } from '@/lib/http'
export { getGuestId } from '@/lib/guest-id'

export function cartQuery(identity: string) {
  return queryOptions({
    queryKey: ['cart', identity],
    queryFn: async ({ signal }) => (await http.get<Cart>('/cart', { signal })).data,
  })
}

export async function addCartItem(input: { nftId: string; editionId: string; quantity: number; expectedVersion: number }) {
  return (await http.post<Cart>('/cart/items', input)).data
}

export async function setCartQuantity(id: string, quantity: number, expectedVersion: number) {
  return (await http.patch<Cart>(`/cart/items/${encodeURIComponent(id)}`, { quantity, expectedVersion })).data
}

export async function deleteCartItem(id: string, expectedVersion: number) {
  return (await http.delete<Cart>(`/cart/items/${encodeURIComponent(id)}`, { headers: { 'If-Match': String(expectedVersion) } })).data
}

export async function applyCartCoupon(code: string, expectedVersion: number) {
  return (await http.put<Cart>('/cart/coupon', { code, expectedVersion })).data
}

export async function removeCartCoupon(expectedVersion: number) {
  return (await http.delete<Cart>('/cart/coupon', { headers: { 'If-Match': String(expectedVersion) } })).data
}

export async function mergeGuestCart(guestId: string, guestVersion: number) {
  return (await http.post<Cart>('/cart/merge', { guestId, guestVersion })).data
}
