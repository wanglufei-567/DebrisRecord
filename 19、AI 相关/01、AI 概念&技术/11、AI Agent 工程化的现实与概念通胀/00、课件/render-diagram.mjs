import { chromium } from '/Users/wangdong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

await page.goto(pathToFileURL(path.join(currentDirectory, 'three-engineering-control-surfaces.html')).href)
await page.screenshot({
  path: path.join(currentDirectory, 'images', 'three-engineering-control-surfaces.png'),
  fullPage: true,
})

await browser.close()
