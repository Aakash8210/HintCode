// Simple simulation of error parsing logic from lib/gemini.ts
const samples = [
  // sample with RetryInfo
  {
    name: 'with-retry',
    error: {
      response: {
        data: {
          error: {
            message: 'You exceeded quota',
            details: [
              { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '28.3451019s' },
            ],
          },
        },
        status: 429,
      },
    },
  },
  // sample without RetryInfo
  {
    name: 'no-retry',
    error: {
      response: {
        data: {
          error: { message: 'Quota exceeded' },
        },
        status: 429,
      },
    },
  },
];

for (const s of samples) {
  const error = s.error;
  const resp = error?.response?.data ?? error?.response ?? null;
  const errorMessage = resp?.error?.message || error.message || 'Unknown Gemini API error';
  const status = error?.response?.status || resp?.error?.status || error?.status || 500;

  let retryAfter;
  const details = resp?.error?.details || [];
  if (Array.isArray(details)) {
    for (const d of details) {
      if (d && d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && d.retryDelay) {
        const m = String(d.retryDelay).match(/([\d.]+)s/);
        if (m) retryAfter = Math.ceil(parseFloat(m[1]));
      }
    }
  }

  const err = new Error(errorMessage);
  err.status = status === 0 ? undefined : status;
  if (retryAfter) err.retryAfter = retryAfter;

  console.log('---', s.name, '---');
  console.log('message:', err.message);
  console.log('status:', err.status);
  console.log('retryAfter:', err.retryAfter);
}
