export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text()
    let message: string
    try {
      const json = JSON.parse(body)
      message = json.detail ?? body
    } catch {
      message = body
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  return fetch(url, opts).then(handleResponse<T>)
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  delete: <T = void>(url: string) => request<T>('DELETE', url),
}
