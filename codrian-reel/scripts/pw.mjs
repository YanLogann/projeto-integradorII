// Carrega o Playwright local (devDependency) ou o global (NODE_PATH).
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch {
  pw = require(require.resolve('playwright', { paths: (process.env.NODE_PATH || '').split(':') }))
}
export const { chromium } = pw
