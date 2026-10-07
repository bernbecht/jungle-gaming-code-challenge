import type { ApiError } from '../contracts/marketplace'

export class MockError extends Error {
  readonly status: number
  readonly body: ApiError
  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.body = { error: { code, message, ...(details ? { details } : {}) } }
  }
}

export function invalid(message: string): never {
  throw new MockError(422, 'VALIDATION_ERROR', message)
}
