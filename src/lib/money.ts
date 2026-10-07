import type { Money, Totals } from '../contracts/marketplace'

const WEI_PER_ETH = 10n ** 18n

export function toWei(value: Money): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,18})?$/.test(value)) throw new RangeError('ETH inválido: use decimal não negativo com até 18 casas.')
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(18, '0'))
}

export function fromWei(value: bigint): Money {
  if (value < 0n) throw new RangeError('ETH não pode ser negativo.')
  const fraction = (value % WEI_PER_ETH).toString().padStart(18, '0').replace(/0+$/, '')
  return `${value / WEI_PER_ETH}${fraction ? `.${fraction}` : ''}`
}

export function assertQuantity(quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new RangeError('Quantidade deve ser um inteiro positivo.')
}

export function calculateTotals(items: { unitPrice: Money; quantity: number }[], networkFee: Money, discountBps = 0): Totals {
  if (!Number.isInteger(discountBps) || discountBps < 0 || discountBps > 10_000) throw new RangeError('Desconto inválido.')
  const subtotal = items.reduce((sum, item) => {
    assertQuantity(item.quantity)
    return sum + toWei(item.unitPrice) * BigInt(item.quantity)
  }, 0n)
  const discount = subtotal * BigInt(discountBps) / 10_000n
  return { subtotal: fromWei(subtotal), discount: fromWei(discount), networkFee: fromWei(toWei(networkFee)), total: fromWei(subtotal - discount + toWei(networkFee)) }
}
