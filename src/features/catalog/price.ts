import type { Nft } from '@/contracts/marketplace'
import { toWei } from '@/lib/money'

export function lowestEdition(nft: Nft) {
  const available = nft.editions.filter(edition => edition.available > 0)
  return (available.length ? available : nft.editions).reduce((a, b) => toWei(a.unitPrice) <= toWei(b.unitPrice) ? a : b)
}
