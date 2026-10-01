// Deploy backend separately, then set its HTTPS base URL (without /api).
// An empty URL keeps the existing localStorage mode and current site behavior.
globalThis.HonkaiBackendConfig = Object.freeze({ baseUrl: '' });
