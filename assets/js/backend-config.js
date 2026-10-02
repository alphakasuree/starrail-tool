// Simulator saves use ID-scoped localStorage; public UID lookup uses a relay.
// The authenticated account backend remains separate from public profile lookup.
globalThis.HonkaiBackendConfig = Object.freeze({ baseUrl: '' });
// Local server relay. For static hosting, set this to your deployed Worker URL.
globalThis.HonkaiUidConfig = Object.freeze({ baseUrl: '/api/hsr' });
