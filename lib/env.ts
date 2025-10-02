export function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} environment variable is not defined`)
  }
  return value
}

// Validate core variables at module load in runtime (only once)
;(function ensureMandatory() {
  if (process.env.NODE_ENV === 'test') return
  ;['MONGODB_URI', 'JWT_SECRET'].forEach((k) => getEnv(k))
})()
