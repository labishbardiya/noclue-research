/*
Visual contract
Scene: a partnership researcher working in daylight, moving from public proof to one deliberate contact request.
World: a light-blue paper desk — white canvas, clear blue ink, thin blue rules, and no decorative dashboard density.
Hierarchy: three destinations only: Guide, Research tool, Saved data.
Interaction: each costly contact action states its provider before the user can click it.
Accessibility: semantic forms, visible labels, keyboard focus, and a stacked narrow-screen layout.
*/
import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'

const cities = ['Delhi', 'Bangalore', 'Pune']
const blankBrief = { title: '', purpose: '', type: 'sponsor', criteria: '', cities: [] }
const blankJob = { name: '', briefId: '', allowedDomains: '', sourceUrls: '', pageBudget: 10 }
const blankRecord = { type: 'person', name: '', company: '', role: '', city: 'Delhi', companyDomain: '', linkedinUrl: '', reason: '', status: 'research', tags: '' }
const splitLines = (value) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean)

function FormField({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

function Empty({ children }) {
  return <p className="empty">{children}</p>
}

function ProviderSetup({ providers, providerKey, setProviderKey, onConnect, busy }) {
  return <section className="provider-setup">
    <div><h2>Connect a contact provider</h2><p>A key is used only when you choose a lookup. It stays in this local server session.</p></div>
    {['apollo', 'rocketreach', 'hunter'].map((key) => {
      const provider = providers[key]
      return <form key={key} onSubmit={(event) => onConnect(event, key)}>
        <div><b>{provider.name}</b><small>{provider.configured ? 'Connected' : 'Not connected'} · {provider.capabilities.join(' + ')}</small></div>
        {provider.configured
          ? <span className="connected">Ready</span>
          : <><input required type="password" minLength="16" autoComplete="off" value={providerKey[key] || ''} onChange={(event) => setProviderKey((current) => ({ ...current, [key]: event.target.value }))} placeholder={`${provider.name} API key`} /><button disabled={busy === `connect-${key}`}>{busy === `connect-${key}` ? 'Connecting…' : `Connect ${provider.name}`}</button></>}
      </form>
    })}
  </section>
}

function App() {
  const [page, setPage] = useState('overview')
  const [data, setData] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [brief, setBrief] = useState(blankBrief)
  const [job, setJob] = useState(blankJob)
  const [record, setRecord] = useState(blankRecord)
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [providerKey, setProviderKey] = useState({ apollo: '', rocketreach: '', hunter: '' })
  const [researchRequest, setResearchRequest] = useState('')
  const [plan, setPlan] = useState(null)
  const [localModel, setLocalModel] = useState(null)
  const [traceJobId, setTraceJobId] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const reload = async () => {
    try { setData(await api.bootstrap()) } catch (error) { setNotice(`Cannot reach the local server: ${error.message}`) }
  }

  useEffect(() => {
    reload()
    api.localModelStatus().then(setLocalModel).catch(() => setLocalModel({ available: false, configuredModel: 'local model' }))
  }, [])

  const selectedRecord = useMemo(() => data?.records.find((item) => item.id === selectedRecordId) || data?.records[0], [data, selectedRecordId])
  useEffect(() => { if (selectedRecord && !selectedRecordId) setSelectedRecordId(selectedRecord.id) }, [selectedRecord, selectedRecordId])

  async function action(name, task) {
    setBusy(name); setNotice('')
    try { const result = await task(); await reload(); return result } catch (error) { setNotice(error.message); return null } finally { setBusy('') }
  }

  async function createPlan(event) {
    event.preventDefault()
    const result = await action('make-plan', () => api.researchPlan(researchRequest))
    if (!result) return
    setPlan(result)
    setBrief({ title: result.title, purpose: result.purpose, type: result.type, criteria: result.criteria, cities: result.cities })
    setJob((current) => ({ ...current, name: `Collection — ${result.title}`.slice(0, 180), allowedDomains: result.recommendedDomains.join('\n') }))
    setNotice('Plan created locally. Review or edit every field below before saving anything.')
  }

  async function submitBrief(event) {
    event.preventDefault()
    const result = await action('brief', () => api.createBrief(brief))
    if (result) { setBrief(blankBrief); setJob((current) => ({ ...current, briefId: result.id })); setNotice('Question saved. Next, choose the exact public pages to collect.') }
  }

  async function submitJob(event) {
    event.preventDefault()
    const result = await action('job', () => api.createJob({ ...job, allowedDomains: splitLines(job.allowedDomains), sourceUrls: splitLines(job.sourceUrls) }))
    if (result) { setJob((current) => ({ ...blankJob, briefId: current.briefId })); setNotice('Collection saved. Check the pages, then run it below.') }
  }

  async function submitRecord(event) {
    event.preventDefault()
    const result = await action('record', () => api.createRecord({ ...record, tags: splitLines(record.tags) }))
    if (result) { setRecord(blankRecord); setSelectedRecordId(result.id); setNotice('Record saved. You can now request a contact lookup.') }
  }

  async function connectProvider(event, provider) {
    event.preventDefault()
    const result = await action(`connect-${provider}`, () => api.connectProvider(provider, providerKey[provider]))
    if (result) { setProviderKey((current) => ({ ...current, [provider]: '' })); setNotice(`${result.provider.name} connected for this local session.`) }
  }

  async function enrich(provider, type) {
    if (!selectedRecord) return setNotice('Save and select a person first.')
    await action(`enrich-${provider}-${type}`, () => api.enrich(selectedRecord.id, provider, type))
  }

  async function attachEvidence(evidenceId) {
    if (!selectedRecord) return setNotice('Select a saved record first.')
    await action(`evidence-${evidenceId}`, () => api.attachEvidence(selectedRecord.id, evidenceId))
  }

  if (!data) return <main className="loading">Opening noClue Research…</main>

  const pages = [
    ['overview', 'Overview', 'Start here'], ['research', 'Research', 'Plan and collect'], ['collections', 'Collections', 'Trace source runs'],
    ['records', 'Records', 'People and organisations'], ['knowledge', 'Knowledge', 'Evidence vault'], ['outreach', 'Outreach', 'Prepare a contact route'], ['playbook', 'Playbook', 'Learn from outcomes'],
  ]

  return <main className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}><div className="sky-backdrop" aria-hidden="true"><i /><i /><i /></div>
    <header className="mac-titlebar">
      <div className="mac-dots" aria-hidden="true"><i /><i /><i /></div>
      <button className="brand" onClick={() => setPage('overview')}>noClue <span>Research</span></button>
      <p>Reality Check intelligence workspace</p>
    </header>
    <div className={`app-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar"><button className="sidebar-toggle" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setSidebarCollapsed((current) => !current)}><span aria-hidden="true" /><b>{sidebarCollapsed ? 'Expand' : 'Collapse'}</b></button><button className="new-research" onClick={() => setPage('research')}>New research</button><nav aria-label="Workspace pages">{pages.map(([id, label, description]) => <button key={id} title={label} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><i aria-hidden="true">{label.slice(0, 1)}</i><b>{label}</b><small>{description}</small></button>)}</nav><div className="sidebar-footer"><b>Evidence first</b><span>Every useful lead keeps its proof.</span></div></aside>
      <section className="workspace">
        {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}>×</button></div>}
        {page === 'overview' && <Guide onStart={() => setPage('research')} onData={() => setPage('records')} />}
        {page === 'research' && <Tool data={data} brief={brief} setBrief={setBrief} job={job} setJob={setJob} selectedRecord={selectedRecord} onBrief={submitBrief} onJob={submitJob} onRun={(id) => action(`run-${id}`, () => api.runJob(id))} onEnrich={enrich} onCheckPhone={(id) => action(`check-${id}`, () => api.checkEnrichment(id))} onSelect={setSelectedRecordId} providerKey={providerKey} setProviderKey={setProviderKey} onConnect={connectProvider} busy={busy} researchRequest={researchRequest} setResearchRequest={setResearchRequest} plan={plan} localModel={localModel} onCreatePlan={createPlan} traceJobId={traceJobId} setTraceJobId={setTraceJobId} />}
        {page === 'collections' && <Collections data={data} busy={busy} traceJobId={traceJobId} setTraceJobId={setTraceJobId} onRun={(id) => action(`run-${id}`, () => api.runJob(id))} />}
        {page === 'records' && <Data data={data} record={record} setRecord={setRecord} selectedRecord={selectedRecord} onSelect={setSelectedRecordId} onSubmit={submitRecord} onAttach={attachEvidence} busy={busy} />}
        {page === 'knowledge' && <Knowledge data={data} />}
        {page === 'outreach' && <Outreach data={data} selectedRecord={selectedRecord} onSelect={setSelectedRecordId} onEnrich={enrich} onCheckPhone={(id) => action(`check-${id}`, () => api.checkEnrichment(id))} busy={busy} />}
        {page === 'playbook' && <Playbook data={data} />}
      </section>
    </div>
  </main>
}

function Collections({ data, busy, traceJobId, setTraceJobId, onRun }) {
  const selected = data.jobs.find((item) => item.id === traceJobId)
  return <><section className="page-title"><div><h1>Collections</h1><p>Each run has a reviewable source trail. Open a trace to see exactly what happened.</p></div></section><section className="collection-page">{data.jobs.length ? data.jobs.map((job) => <article key={job.id}><div><b>{job.name}</b><p>{job.results?.filter((result) => result.status === 'collected').length || 0} collected · {job.sourceUrls.length} approved source{job.sourceUrls.length === 1 ? '' : 's'} · {job.status}</p></div><div className="run-actions"><button className="quiet-button" disabled={!job.trace?.length} onClick={() => setTraceJobId(job.id)}>View trace</button><button disabled={busy === `run-${job.id}`} onClick={() => onRun(job.id)}>{busy === `run-${job.id}` ? 'Collecting…' : 'Run again'}</button></div></article>) : <Empty>No collections saved yet. Create one in Research.</Empty>}</section><RunTrace job={selected} onClose={() => setTraceJobId('')} /></>
}

function Knowledge({ data }) {
  const snapshots = data.snapshots || []
  return <><section className="page-title"><div><h1>Knowledge</h1><p>Evidence is kept with its source and collection date so the team can reuse it safely.</p></div></section><section className="knowledge-page"><div><h2>Research vault</h2><p>Drop Reality Check material, organiser notes, brochures, and campaign files here in the next build. The vault will retrieve grounded context for research and outreach without inventing facts.</p><button disabled>Knowledge upload — next build</button></div><div><h2>Latest public evidence</h2>{snapshots.length ? snapshots.slice(0, 8).map((snapshot) => <a key={snapshot.id} href={snapshot.finalUrl} target="_blank" rel="noreferrer"><b>{snapshot.title || 'Untitled source'}</b><span>{new Date(snapshot.retrievedAt).toLocaleDateString()} · {snapshot.finalUrl}</span></a>) : <Empty>Run a collection to store public evidence.</Empty>}</div></section></>
}

function Outreach({ data, selectedRecord, onSelect, onEnrich, onCheckPhone, busy }) {
  const people = data.records.filter((item) => item.type === 'person')
  const lookups = data.enrichments.filter((item) => item.recordId === selectedRecord?.id).slice(0, 5)
  return <><section className="page-title"><div><h1>Outreach</h1><p>Choose a saved person, confirm why they are relevant, then request one deliberate work-contact lookup.</p></div></section><section className="outreach-page"><div><h2>Choose a person</h2><select value={selectedRecord?.id || ''} onChange={(event) => onSelect(event.target.value)}><option value="">Choose saved person</option>{people.map((person) => <option value={person.id} key={person.id}>{person.name} · {person.company || 'company missing'}</option>)}</select>{selectedRecord && <div className="chosen-person"><b>{selectedRecord.name}</b><p>{selectedRecord.reason}</p><small>{selectedRecord.linkedinUrl || selectedRecord.companyDomain || 'Add a public LinkedIn address or company domain in Records first.'}</small></div>}</div><div><h2>Request contact information</h2><p>These actions can use provider credits. They never run until you choose one.</p><div className="contact-actions"><button disabled={!selectedRecord || busy.startsWith('enrich-')} onClick={() => onEnrich('apollo', 'email')}>Apollo: work email</button><button disabled={!selectedRecord || busy.startsWith('enrich-')} onClick={() => onEnrich('rocketreach', 'both')}>RocketReach: email + phone</button><button disabled={!selectedRecord || busy.startsWith('enrich-')} onClick={() => onEnrich('hunter', 'email')}>Hunter: work email</button><button disabled={!selectedRecord || busy.startsWith('enrich-')} onClick={() => onEnrich('surfe', 'email')}>Surfe: email</button></div>{lookups.map((lookup) => <p className="lookup" key={lookup.id}><b>{lookup.provider}</b> · {lookup.status}{lookup.result?.email ? ` · ${lookup.result.email}` : ''}{lookup.result?.phoneNumbers?.length ? ` · ${lookup.result.phoneNumbers.join(', ')}` : ''}{lookup.status === 'phone_pending' && <button onClick={() => onCheckPhone(lookup.id)}>Check Apollo phone result</button>}</p>)}</div></section></>
}

function Playbook({ data }) {
  return <><section className="page-title"><div><h1>Playbook</h1><p>What worked, what failed, and what the team should do differently next time.</p></div></section><section className="playbook-page"><article><h2>Message experiments</h2><p>{data.messageExperiments?.length || 0} outcomes recorded. Every future message should retain its audience, angle, call-to-action, send date, and reply result.</p></article><article><h2>Objection library</h2><p>{data.objections?.length || 0} objections recorded. Group replies such as “no budget,” “not our audience,” or “send more data” with the response that worked.</p></article><article><h2>Relationship map</h2><p>{data.relationshipLinks?.length || 0} links recorded. Connect needs, companies, people, evidence, messages, and outcomes without losing context.</p></article></section></>
}

function Guide({ onStart, onData }) {
  return <>
    <section className="intro"><p>Research without guessing.</p><h1>Ask for what you need.<br />Keep the proof.<br />Then find a way in.</h1><button className="primary" onClick={onStart}>Open research tool</button></section>
    <section className="steps">
      <article><span>01</span><h2>Describe the outcome</h2><p>Write one normal sentence. The local model turns it into an editable research brief.</p></article>
      <article><span>02</span><h2>Collect public proof</h2><p>Choose the exact company or event pages the tool may read. This does not use paid provider credit.</p></article>
      <article><span>03</span><h2>Request a work contact</h2><p>Only after you select a useful person, choose one contact provider.</p></article>
    </section>
    <section className="guide-note">
      <div><h2>What is a page limit?</h2><p>“10 pages” is the maximum number of public webpages the tool will read in one collection. It is a safety limit, not a credit charge.</p></div>
      <div><h2>What uses paid credits?</h2><p>Only a contact lookup. The tool names the provider before you request it.</p></div>
      <button onClick={onData}>See saved research</button>
    </section>
  </>
}

function PlanReview({ plan }) {
  if (!plan) return null
  return <aside className="plan-review">
    <div><h3>Plan preview</h3><p>{plan.targetCount} results · {plan.cities.join(', ') || 'cities to confirm'}</p></div>
    <div><b>Useful signals</b><p>{plan.criteria || 'Add your own evaluation rule.'}</p></div>
    <div><b>Exclude</b><p>{plan.exclusions?.join(', ') || 'Nothing specified.'}</p></div>
    <div><b>Public-source searches to use</b><p>{plan.suggestedSourceQueries?.join(' · ') || 'Choose exact public pages yourself.'}</p></div>
    <small>Suggested domains are a starting point only. Add exact webpage addresses yourself before any collection runs.</small>
  </aside>
}

function RunTrace({ job, onClose }) {
  if (!job) return null
  const trace = job.trace || []
  return <section className="trace-window" aria-label={`Research trace for ${job.name}`}>
    <div className="trace-window-head"><div><h2>Research trace</h2><p>{job.name}</p></div><button onClick={onClose}>Close</button></div>
    <p className="trace-explainer">This is an inspectable activity record: approved scope, source actions, visible findings, and decision summaries. It does not expose hidden model reasoning.</p>
    {trace.length ? <ol className="trace-list">{trace.map((step, index) => <li key={step.id} className={`trace-${step.state}`}><span>{String(index + 1).padStart(2, '0')}</span><details open={index === trace.length - 1}><summary>{step.title}</summary><p>{step.summary}</p>{step.findings && <p className="trace-finding">{step.findings.title || 'Untitled source'} · {step.findings.publicEmailRoutes} public email route{step.findings.publicEmailRoutes === 1 ? '' : 's'} found</p>}{step.sources?.length ? <div className="trace-sources">{step.sources.map((source) => <a href={source} target="_blank" rel="noreferrer" key={source}>{source}</a>)}</div> : null}</details></li>)}</ol> : <Empty>This saved job predates research traces. Run it again to create one.</Empty>}
  </section>
}

function Tool({ data, brief, setBrief, job, setJob, selectedRecord, onBrief, onJob, onRun, onEnrich, onCheckPhone, onSelect, providerKey, setProviderKey, onConnect, busy, researchRequest, setResearchRequest, plan, localModel, onCreatePlan, traceJobId, setTraceJobId }) {
  const updateBrief = (event) => setBrief((current) => ({ ...current, [event.target.name]: event.target.value }))
  const updateJob = (event) => setJob((current) => ({ ...current, [event.target.name]: event.target.value }))
  const lookups = data.enrichments.filter((item) => item.recordId === selectedRecord?.id).slice(0, 4)
  const modelReady = Boolean(localModel?.available)

  return <>
    <section className="page-title"><div><h1>What are you trying to make happen?</h1><p>Describe the outcome. The system turns it into a research plan you control.</p></div></section>
    <section className="request-box">
      <div><h2>What do you want to find?</h2><p>{modelReady ? `${localModel.configuredModel} is running locally on this Mac. It helps structure the job; it does not spend provider credits or search the web.` : 'The local planning model is not ready. Start Ollama, then reload this page.'}</p></div>
      <form onSubmit={onCreatePlan}>
        <textarea required value={researchRequest} onChange={(event) => setResearchRequest(event.target.value)} placeholder="Example: Find 15 strong AI speakers in Bangalore who have shipped real products, can explain engineering failures honestly, and will matter to builders and enterprise leaders." />
        <button className="primary" disabled={!modelReady || busy === 'make-plan'}>{busy === 'make-plan' ? 'Making plan…' : 'Make my research plan'}</button>
      </form>
      <PlanReview plan={plan} />
    </section>
    <div className="work-grid">
      <form className="work-block" onSubmit={onBrief}>
        <h2>Review the research question</h2><p>These fields come from your request. Change anything that does not match your goal.</p>
        <FormField label="Research question"><input required name="title" value={brief.title} onChange={updateBrief} placeholder="Venue partners in three cities" /></FormField>
        <FormField label="What decision will this support?"><textarea required name="purpose" value={brief.purpose} onChange={updateBrief} placeholder="Choose companies to approach for venue support." /></FormField>
        <FormField label="Research type"><select name="type" value={brief.type} onChange={updateBrief}><option value="sponsor">Sponsor</option><option value="venue">Venue</option><option value="speaker">Speaker</option><option value="community">Community</option><option value="participant">Participant</option></select></FormField>
        <FormField label="What makes a result worth saving?"><textarea name="criteria" value={brief.criteria} onChange={updateBrief} placeholder="Relevant product work, clear public proof, and a useful reason to invite them." /></FormField>
        <FormField label="Cities"><div className="city-checks">{cities.map((city) => <label key={city}><input type="checkbox" checked={brief.cities.includes(city)} onChange={() => setBrief((current) => ({ ...current, cities: current.cities.includes(city) ? current.cities.filter((item) => item !== city) : [...current.cities, city] }))} />{city}</label>)}</div></FormField>
        <button className="primary" disabled={busy === 'brief'}>{busy === 'brief' ? 'Saving…' : 'Save research question'}</button>
      </form>
      <form className="work-block" onSubmit={onJob}>
        <h2>Review collection access</h2><p>The model can suggest domains. You alone choose the exact pages the collector can read.</p>
        <FormField label="Saved research question"><select required name="briefId" value={job.briefId} onChange={updateJob}><option value="">Choose a question</option>{data.briefs.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></FormField>
        <FormField label="Collection name"><input required name="name" value={job.name} onChange={updateJob} placeholder="Official partnership pages" /></FormField>
        <FormField label="Allowed website domains"><textarea required name="allowedDomains" value={job.allowedDomains} onChange={updateJob} placeholder={'company.com\nevent.org'} /></FormField>
        <FormField label="Exact public webpage addresses"><textarea required name="sourceUrls" value={job.sourceUrls} onChange={updateJob} placeholder={'https://company.com/partnerships'} /></FormField>
        <FormField label="Maximum pages to read — free"><input min="1" max="50" required type="number" name="pageBudget" value={job.pageBudget} onChange={updateJob} /></FormField>
        <button className="primary" disabled={busy === 'job'}>{busy === 'job' ? 'Saving…' : 'Save collection'}</button>
      </form>
    </div>
    <section className="run-list"><h2>Run a saved collection</h2>{data.jobs.length ? data.jobs.map((item) => <article key={item.id}><div><b>{item.name}</b><p>Up to {item.pageBudget} public pages · no paid credit</p></div><div className="run-actions"><button className="quiet-button" disabled={!item.trace?.length} onClick={() => setTraceJobId(item.id)}>View trace</button><button disabled={busy === `run-${item.id}` || item.status === 'running'} onClick={() => onRun(item.id)}>{busy === `run-${item.id}` ? 'Reading pages…' : 'Collect pages'}</button></div></article>) : <Empty>Save a collection above first.</Empty>}</section>
    <RunTrace job={data.jobs.find((item) => item.id === traceJobId)} onClose={() => setTraceJobId('')} />
    <ProviderSetup providers={data.providers} providerKey={providerKey} setProviderKey={setProviderKey} onConnect={onConnect} busy={busy} />
    <section className="contact-tool">
      <div><h2>Find a contact for a saved person</h2><p>Select one person, then choose exactly one provider. No lookup is automatic.</p><select value={selectedRecord?.id || ''} onChange={(event) => onSelect(event.target.value)}><option value="">Choose saved person</option>{data.records.filter((item) => item.type === 'person').map((item) => <option key={item.id} value={item.id}>{item.name} · {item.company || 'company missing'}</option>)}</select></div>
      {selectedRecord ? <div className="contact-actions"><p><b>{selectedRecord.name}</b><br />{selectedRecord.linkedinUrl || selectedRecord.companyDomain || 'Add a company domain or LinkedIn address in Saved data first.'}</p><div><button disabled={busy.startsWith('enrich-')} onClick={() => onEnrich('apollo', 'email')}>Apollo: work email</button><button disabled={busy.startsWith('enrich-')} onClick={() => onEnrich('rocketreach', 'both')}>RocketReach: email + phone</button><button disabled={busy.startsWith('enrich-')} onClick={() => onEnrich('hunter', 'email')}>Hunter: work email</button><button disabled={busy.startsWith('enrich-')} onClick={() => onEnrich('surfe', 'email')}>Surfe: email</button></div>{lookups.map((lookup) => <p className="lookup" key={lookup.id}><b>{lookup.provider}</b> · {lookup.status}{lookup.result?.email ? ` · ${lookup.result.email}` : ''}{lookup.result?.phoneNumbers?.length ? ` · ${lookup.result.phoneNumbers.join(', ')}` : ''}{lookup.status === 'phone_pending' && <button onClick={() => onCheckPhone(lookup.id)}>Check Apollo phone result</button>}</p>)}</div> : <Empty>Save a person in Saved data, then select them here.</Empty>}
    </section>
  </>
}

function Data({ data, record, setRecord, selectedRecord, onSelect, onSubmit, onAttach, busy }) {
  const update = (event) => setRecord((current) => ({ ...current, [event.target.name]: event.target.value }))
  const evidence = data.evidence.filter((item) => item.reviewStatus === 'unreviewed')
  return <>
    <section className="page-title"><div><h1>Saved data</h1><p>People, organisations, proof, and lookup history are kept here for review.</p></div><a href={api.exportUrl}>Export CSV</a></section>
    <div className="data-grid">
      <form className="work-block" onSubmit={onSubmit}><h2>Save a person or organisation</h2><FormField label="Type"><select name="type" value={record.type} onChange={update}><option value="person">Person</option><option value="company">Company</option><option value="venue">Venue</option></select></FormField><FormField label="Name"><input required name="name" value={record.name} onChange={update} /></FormField><FormField label="Company"><input name="company" value={record.company} onChange={update} /></FormField><FormField label="Role"><input name="role" value={record.role} onChange={update} /></FormField><FormField label="City"><select name="city" value={record.city} onChange={update}>{[...cities, 'All cities'].map((city) => <option key={city}>{city}</option>)}</select></FormField><FormField label="Company domain"><input name="companyDomain" value={record.companyDomain} onChange={update} placeholder="company.com" /></FormField><FormField label="Public LinkedIn address"><input name="linkedinUrl" value={record.linkedinUrl} onChange={update} placeholder="https://linkedin.com/in/..." /></FormField><FormField label="Why is this useful?"><textarea required name="reason" value={record.reason} onChange={update} /></FormField><button className="primary" disabled={busy === 'record'}>{busy === 'record' ? 'Saving…' : 'Save record'}</button></form>
      <section className="saved-list"><h2>Saved records <span>{data.records.length}</span></h2>{data.records.length ? data.records.map((item) => <button key={item.id} className={selectedRecord?.id === item.id ? 'selected' : ''} onClick={() => onSelect(item.id)}><b>{item.name}</b><span>{[item.role, item.company, item.city].filter(Boolean).join(' · ')}</span><small>{item.type} · {item.status}</small></button>) : <Empty>No records yet.</Empty>}</section>
      <section className="proof-list"><h2>Public proof waiting for review <span>{evidence.length}</span></h2>{evidence.length ? evidence.map((item) => <article key={item.id}><b>{item.field}</b><p>{item.value}</p><button disabled={!selectedRecord || busy === `evidence-${item.id}`} onClick={() => onAttach(item.id)}>Attach to selected record</button></article>) : <Empty>Collect public pages in the Research tool to see proof here.</Empty>}</section>
    </div>
    <section className="memory-ledger"><div><h2>Institutional memory</h2><p>Every item below becomes reusable evidence for the next Reality Check campaign.</p></div><dl><div><dt>Evidence trail</dt><dd>{data.evidence.length} source record{data.evidence.length === 1 ? '' : 's'}</dd></div><div><dt>Freshness</dt><dd>Source date retained with every snapshot</dd></div><div><dt>Opportunity graph</dt><dd>Links are stored separately from people and companies</dd></div><div><dt>Message experiments</dt><dd>{data.messageExperiments?.length || 0} outcomes recorded</dd></div><div><dt>Objection library</dt><dd>{data.objections?.length || 0} reusable response{(data.objections?.length || 0) === 1 ? '' : 's'}</dd></div><div><dt>Approval gate</dt><dd>Contact lookup and sending remain human actions</dd></div></dl><small>Portable exports and relationship links are stored in the workspace data model so a provider can be replaced without losing research history.</small></section>
    {selectedRecord && <section className="selected-data"><h2>{selectedRecord.name}</h2><p>{selectedRecord.reason}</p><p><b>Contact input:</b> {selectedRecord.linkedinUrl || selectedRecord.companyDomain || 'Not added yet'}</p></section>}
  </>
}

export default App
