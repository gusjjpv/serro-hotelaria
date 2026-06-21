function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseFieldErrors(
  body: unknown,
  prefix = '',
): { fieldErrors: Record<string, any>; apiMessage: string } {
  if (Array.isArray(body)) {
    return { fieldErrors: {}, apiMessage: body.filter(Boolean).join('. ') || 'Erro ao salvar.' }
  }
  if (!isRecord(body)) {
    return { fieldErrors: {}, apiMessage: 'Erro ao salvar.' }
  }
  if ('detail' in body && typeof body.detail === 'string') {
    return { fieldErrors: {}, apiMessage: body.detail }
  }

  const fieldErrors: Record<string, any> = {}
  const topLevelMessages: string[] = []

  for (const [key, value] of Object.entries(body)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key

    if (Array.isArray(value)) {
      const msg = value.filter(Boolean).join('. ')
      if (msg) {
        if (prefix) {
          fieldErrors[prefix] ??= {}
          fieldErrors[prefix][key] = { message: msg }
        } else {
          fieldErrors[key] = { message: msg }
        }
      }
    } else if (isRecord(value)) {
      const nested = parseFieldErrors(value, fieldPath)
      Object.assign(fieldErrors, nested.fieldErrors)
      topLevelMessages.push(...nested.apiMessage.split('. ').filter(Boolean))
    } else {
      topLevelMessages.push(String(value))
    }
  }

  return { fieldErrors, apiMessage: topLevelMessages.join('. ') || 'Erro ao salvar.' }
}

export async function extractApiError(err: unknown): Promise<string> {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response: Response }).response
    try {
      const body = await response.clone().json() as Record<string, string[]>
      return Object.values(body).flat().join(' ')
    } catch {
      return 'Erro ao conectar ao servidor.'
    }
  }
  if (err instanceof Error) return err.message
  return 'Erro ao conectar ao servidor.'
}

export async function extractApiErrorParsed(err: unknown): Promise<{ fieldErrors: Record<string, any>; apiMessage: string }> {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response: Response }).response
    try {
      const body = await response.clone().json()
      return parseFieldErrors(body)
    } catch {
      return { fieldErrors: {}, apiMessage: 'Erro ao conectar ao servidor.' }
    }
  }
  if (err instanceof Error) return { fieldErrors: {}, apiMessage: err.message }
  return { fieldErrors: {}, apiMessage: 'Erro ao conectar ao servidor.' }
}
