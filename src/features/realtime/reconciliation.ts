import type { Quote } from '../../contracts/marketplace'

export const reconnectGenerationQueryKey = ['realtime', 'reconnect-generation'] as const

function quoteTerms(quote: Quote) {
  return JSON.stringify({
    cartVersion: quote.cartVersion,
    network: quote.network,
    couponCode: quote.couponCode,
    items: quote.items.map(item => ({
      id: item.id,
      nftId: item.nftId,
      editionId: item.editionId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      available: item.available,
      availability: item.availability,
    })),
    totals: quote.totals,
  })
}

export function quoteTermsChanged(previous: Quote, latest: Quote) {
  return quoteTerms(previous) !== quoteTerms(latest)
}
