import { expect, test } from '@playwright/test'
import { validateCatalogSearch, catalogSearchParams } from '../../src/features/catalog/search'

test('URL validator rejects unsafe values and normalizes multi-value filters', () => {
  const value = validateCatalogSearch({ page: -1, pageSize: 999, sort: 'bad', network: ['solana', 'bad', 'solana'], category: [' Art ', 'Art'], minPrice: '1e3', availableOnly: 'false' })
  expect(value).toMatchObject({ page: 1, pageSize: 12, sort: 'featured', network: ['solana'], category: ['Art'], minPrice: undefined, availableOnly: false })
  expect(validateCatalogSearch({ minPrice: '2', maxPrice: '1' })).toMatchObject({ minPrice: undefined, maxPrice: undefined })
})
test('REST serializer preserves repeated filters and decimal precision', () => {
  const value = validateCatalogSearch({ network: ['ethereum', 'solana'], minPrice: '0.000000000000000001', availableOnly: true, page: '2' })
  const search = catalogSearchParams(value)
  expect(search.getAll('network')).toEqual(['ethereum', 'solana'])
  expect(search.get('minPrice')).toBe('0.000000000000000001')
  expect(search.get('page')).toBe('2')
  expect(search.get('availableOnly')).toBe('true')
})
