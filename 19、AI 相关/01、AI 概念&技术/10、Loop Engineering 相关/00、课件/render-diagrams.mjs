import { chromium } from '/Users/wangdong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const diagrams = [
  'loop-timescales',
  'harness-loop-boundary',
  'controlled-improvement-loop',
]

const renderOverrides = {
  'harness-loop-boundary': `
    .step:not(:last-child)::after {
      content: "→";
      right: -22px;
      top: 268px;
      width: 24px;
      padding: 0;
      background: transparent;
      font-size: 22px;
      font-weight: 900;
    }
  `,
  'loop-timescales': `
    main { padding: 42px 62px; }
    h1 { font-size: 36px; line-height: 1.12; }
    .canvas { margin-top: 24px; }
    .legend { right: 16px; bottom: 8px; color: #aab7ca; }
  `,
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

for (const diagram of diagrams) {
  await page.goto(pathToFileURL(path.join(currentDirectory, `${diagram}.html`)).href)
  if (renderOverrides[diagram]) {
    await page.addStyleTag({ content: renderOverrides[diagram] })
  }
  await page.screenshot({
    path: path.join(currentDirectory, 'images', `${diagram}.png`),
    fullPage: true,
  })
}

await browser.close()
