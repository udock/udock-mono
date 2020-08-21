export default function safeParseJSON<T> (jsonString: string | null, defaultValue: T) {
  if (jsonString != null) {
    try {
      return JSON.parse(jsonString)
    } catch {}
  }
  return defaultValue
}
