#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { countTokens } from 'gpt-tokenizer'
import { encodeRecords, serialize } from '../../packages/toon/src/index.js'

const REPO_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const RESULTS_DIR = join(REPO_ROOT, 'benchmarks', 'results')
const REPORT_PATH = join(RESULTS_DIR, '2026-07-15-token-efficiency.md')
const EXTENSIONS = {
  'toon-ext-primitive-array-columns': { primitiveArrayColumns: true },
  'toon-ext-child-tables': { nestedTabularHeaders: true, objectArrayColumns: true },
  'toon-ext-delimiter-pipe': { delimiter: '|' },
  'toon-ext-keyed-map-collapse': { nestedTabularHeaders: true, keyedMapCollapse: true },
  'toon-ext-all': {
    nestedTabularHeaders: true,
    keyedMapCollapse: true,
    primitiveArrayColumns: true,
    objectArrayColumns: true,
  },
}

const encoder = new TextEncoder()

function bytes(value) {
  return encoder.encode(value).length
}

function metric(text) {
  return { bytes: bytes(text), tokens: countTokens(text) }
}

function pct(value, base) {
  if (base === 0) return 'n/a'
  return `${(((value - base) / base) * 100).toFixed(1)}%`
}

function mulberry32(seed) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(random, values) {
  return values[Math.floor(random() * values.length)]
}

function upstreamDatasets() {
  const random = mulberry32(0x129a1)
  const repos = Array.from({ length: 120 }, (_, index) => ({
    id: index + 1,
    owner: pick(random, ['reddb-io', 'toon-format', 'example', 'infra']),
    name: `repo-${String(index + 1).padStart(3, '0')}`,
    language: pick(random, ['TypeScript', 'Rust', 'Python', 'Go']),
    stars: Math.floor(random() * 50000),
    archived: random() > 0.94,
  }))
  const analytics = Array.from({ length: 240 }, (_, index) => ({
    ts: `2026-07-${String((index % 14) + 1).padStart(2, '0')}T${String(index % 24).padStart(2, '0')}:00:00Z`,
    path: pick(random, ['/docs', '/install', '/pricing', '/benchmarks']),
    country: pick(random, ['BR', 'US', 'DE', 'JP']),
    visitors: Math.floor(25 + random() * 900),
    conversions: Math.floor(random() * 40),
  }))
  const orders = Array.from({ length: 180 }, (_, index) => ({
    id: `ord_${String(index + 1).padStart(5, '0')}`,
    status: pick(random, ['paid', 'packed', 'shipped', 'refunded']),
    total: Number((15 + random() * 400).toFixed(2)),
    tags: [pick(random, ['new', 'vip', 'gift']), pick(random, ['fragile', 'bulk', 'standard'])],
    lines: [
      { sku: `sku_${index % 17}`, qty: 1 + (index % 4), price: Number((5 + random() * 90).toFixed(2)) },
      { sku: `sku_${(index + 9) % 17}`, qty: 1 + (index % 2), price: Number((5 + random() * 90).toFixed(2)) },
    ],
  }))
  const logs = Array.from({ length: 300 }, (_, index) => ({
    ts: `2026-07-15T16:${String(index % 60).padStart(2, '0')}:00Z`,
    level: pick(random, ['debug', 'info', 'warn', 'error']),
    service: pick(random, ['api', 'worker', 'scheduler']),
    msg: pick(random, ['started', 'claimed job', 'retrying', 'completed']),
    request_id: `req_${String(index + 1).padStart(6, '0')}`,
  }))

  const orderSummaries = orders.map(({ id, status, total, tags }) => ({
    id,
    status,
    total,
    tag1: tags[0],
    tag2: tags[1],
  }))

  return [
    { name: 'upstream-github-repos', value: { repos }, records: repos },
    { name: 'upstream-analytics', value: { analytics }, records: analytics },
    { name: 'upstream-orders', value: { orders }, records: orderSummaries },
    { name: 'streaming-logs', value: { logs }, records: logs },
  ]
}

function localDatasets() {
  const wire = JSON.parse(readFileSync(join(REPO_ROOT, 'tests/corpus/wire-efficiency/corpora.json'), 'utf8'))
  const datasets = wire.cases.map((testCase) => ({
    name: `wire-${testCase.name}`,
    value: testCase.value,
    records: firstRecordArray(testCase.value),
  }))
  const primitive = JSON.parse(readFileSync(join(REPO_ROOT, 'tests/corpus/wire-efficiency/primitive-array-columns.json'), 'utf8'))
  datasets.push(...primitive.cases.map((testCase) => ({
    name: `wire-extension-${slug(testCase.name)}`,
    value: testCase.expected,
    records: firstRecordArray(testCase.expected),
  })))
  const objectArray = JSON.parse(readFileSync(join(REPO_ROOT, 'tests/corpus/wire-efficiency/object-array-columns.json'), 'utf8'))
  datasets.push(...objectArray.cases.map((testCase) => ({
    name: `wire-extension-${slug(testCase.name)}`,
    value: testCase.expected,
    records: firstRecordArray(testCase.expected),
  })))
  return datasets
}

function firstRecordArray(value) {
  if (Array.isArray(value) && value.every(isFlatRecord)) return value
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      if (Array.isArray(item) && item.every(isFlatRecord)) return item
    }
  }
  return null
}

function isFlatRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every((item) => item === null || typeof item !== 'object')
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function jsonl(records) {
  return records.map((record) => JSON.stringify(record)).join('\n') + '\n'
}

function csv(records) {
  if (!records) return null
  const fields = [...new Set(records.flatMap((record) => Object.keys(record)))].sort()
  const lines = [fields.join(',')]
  for (const record of records) {
    lines.push(fields.map((field) => csvCell(record[field])).join(','))
  }
  return `${lines.join('\n')}\n`
}

function csvCell(value) {
  const text = value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function yaml(value, depth = 0) {
  const indent = '  '.repeat(depth)
  if (Array.isArray(value)) {
    return value.map((item) => `${indent}- ${yamlScalarOrNested(item, depth + 1)}`).join('\n') + '\n'
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, item]) => `${indent}${key}: ${yamlScalarOrNested(item, depth + 1)}`).join('\n') + '\n'
  }
  return `${indent}${JSON.stringify(value)}\n`
}

function yamlScalarOrNested(value, depth) {
  if (value && typeof value === 'object') return `\n${yaml(value, depth).trimEnd()}`
  return JSON.stringify(value)
}

function xml(value, name = 'root') {
  if (Array.isArray(value)) return `<${name}>${value.map((item) => xml(item, 'item')).join('')}</${name}>`
  if (value && typeof value === 'object') {
    return `<${name}>${Object.entries(value).map(([key, item]) => xml(item, key)).join('')}</${name}>`
  }
  return `<${name}>${escapeXml(String(value))}</${name}>`
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function formatsFor(dataset) {
  const formats = new Map([
    ['json-minified', JSON.stringify(dataset.value)],
    ['json-pretty', JSON.stringify(dataset.value, null, 2)],
    ['yaml', yaml(dataset.value)],
    ['xml', xml(dataset.value)],
    ['toon-v3.3-canonical', serialize(dataset.value)],
  ])
  for (const [name, options] of Object.entries(EXTENSIONS)) {
    formats.set(name, serialize(dataset.value, options))
  }
  if (dataset.records) {
    formats.set('jsonl', jsonl(dataset.records))
    formats.set('csv', csv(dataset.records))
    formats.set('toonl', encodeRecords(dataset.records))
  }
  return formats
}

function renderReport(rows) {
  const command = 'pnpm benchmark:tokens'
  const lines = [
    '# Token Efficiency Benchmark',
    '',
    `Command: \`${command}\``,
    '',
    'Tokenizer: `o200k_base` via `gpt-tokenizer`.',
    '',
    '| Dataset | Format | Bytes | Tokens | Tokens vs minified JSON |',
    '| --- | --- | ---: | ---: | ---: |',
  ]
  for (const row of rows) {
    lines.push(`| ${row.dataset} | ${row.format} | ${row.bytes} | ${row.tokens} | ${row.vsJson} |`)
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

const datasets = [...upstreamDatasets(), ...localDatasets()]
const rows = []
for (const dataset of datasets) {
  const formats = formatsFor(dataset)
  const jsonTokens = metric(formats.get('json-minified')).tokens
  for (const [format, text] of formats) {
    const counts = metric(text)
    rows.push({
      dataset: dataset.name,
      format,
      bytes: counts.bytes,
      tokens: counts.tokens,
      vsJson: pct(counts.tokens, jsonTokens),
    })
  }
}

mkdirSync(RESULTS_DIR, { recursive: true })
writeFileSync(REPORT_PATH, renderReport(rows))
console.log(`wrote ${REPORT_PATH}`)
