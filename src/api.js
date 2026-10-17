const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://localhost:8787' : '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options })
  const isCsv = response.headers.get('content-type')?.includes('text/csv')
  const data = isCsv ? await response.text() : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? 'The request could not be completed.')
  return data
}

export const api = {
  bootstrap: () => request('/api/bootstrap'),
  localModelStatus: () => request('/api/local-model/status'),
  researchPlan: (researchRequest) => request('/api/research-plan', { method: 'POST', body: JSON.stringify({ request: researchRequest }) }),
  createBrief: (body) => request('/api/briefs', { method: 'POST', body: JSON.stringify(body) }),
  createJob: (body) => request('/api/jobs', { method: 'POST', body: JSON.stringify(body) }),
  runJob: (id) => request(`/api/jobs/${id}/run`, { method: 'POST' }),
  createRecord: (body) => request('/api/records', { method: 'POST', body: JSON.stringify(body) }),
  patchRecord: (id, body) => request(`/api/records/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  attachEvidence: (recordId, evidenceId) => request(`/api/records/${recordId}/evidence`, { method: 'POST', body: JSON.stringify({ evidenceId }) }),
  createDraft: (body) => request('/api/drafts', { method: 'POST', body: JSON.stringify(body) }),
  approveDraft: (id) => request(`/api/drafts/${id}/approve`, { method: 'POST' }),
  connectProvider: (provider, apiKey) => request(`/api/providers/${provider}/connect`, { method: 'POST', body: JSON.stringify({ apiKey }) }),
  credits: () => request('/api/surfe/credits'),
  enrich: (recordId, provider, enrichmentType) => request(`/api/records/${recordId}/enrich`, { method: 'POST', body: JSON.stringify({ provider, enrichmentType }) }),
  checkEnrichment: (id) => request(`/api/enrichments/${id}/check`, { method: 'POST' }),
  exportUrl: `${API_BASE}/api/export/records.csv`,
}
