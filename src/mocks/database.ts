import { createFixtures } from './fixtures'
import { SCHEMA_VERSION } from './state'
import type { DatabaseState } from './state'

const DATABASE_NAME = 'kurio-demo'
const STORE = 'state'
let opening: Promise<IDBDatabase> | undefined
let fixtures: Promise<DatabaseState> | undefined

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onerror = () => { opening = undefined; reject(request.error) }
    request.onblocked = () => { opening = undefined; reject(new Error('Feche as outras abas da demonstração para atualizar o banco.')) }
    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => { database.close(); opening = undefined }
      resolve(database)
    }
  })
  return opening
}

/** Synchronous reducers keep the IndexedDB transaction alive and atomic across tabs. */
export async function transact<T>(operation: (state: DatabaseState) => T): Promise<T> {
  fixtures ??= createFixtures()
  const [database, seed] = await Promise.all([open(), fixtures])
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    const store = transaction.objectStore(STORE)
    const request = store.get('database')
    let result: T
    let failure: unknown
    request.onsuccess = () => {
      try {
        const stored = request.result as DatabaseState | undefined
        const state = stored?.schemaVersion === SCHEMA_VERSION ? stored : structuredClone(seed)
        result = operation(state)
        if (result instanceof Promise) throw new Error('O reducer do banco deve ser síncrono.')
        store.put(state, 'database')
      } catch (error) { failure = error; transaction.abort() }
    }
    transaction.oncomplete = () => resolve(structuredClone(result))
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Transação abortada.'))
    transaction.onerror = () => { failure ??= transaction.error }
  })
}

export async function resetDatabase(now?: number): Promise<void> {
  const seed = await createFixtures(now)
  await transact(state => { for (const key of Object.keys(state)) delete (state as unknown as Record<string, unknown>)[key]; Object.assign(state, seed) })
}
