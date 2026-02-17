import { useEffect } from 'react'

const STEPS = [
  { n: 1, title: 'Open Chrome Extensions', text: 'In Chrome, go to chrome://extensions (or Menu → More tools → Extensions).' },
  { n: 2, title: 'Enable Developer mode', text: 'Turn on the "Developer mode" toggle in the top-right corner.' },
  { n: 3, title: 'Load the extension', text: 'Click "Load unpacked" and select the extension folder from your Kliek project (the folder that contains manifest.json).' },
  { n: 4, title: 'Use it', text: 'Open any recipe page (or Instagram post), click the Kliek extension icon in the toolbar, then "Send recipe to Kliek". The recipe will open in this app.' },
]

interface ExtensionInstallGuideProps {
  onClose: () => void
}

export default function ExtensionInstallGuide({ onClose }: ExtensionInstallGuideProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="extension-guide-title"
    >
      <div
        className="bg-cream rounded-2xl border border-border shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 id="extension-guide-title" className="font-recipe text-xl font-semibold text-ink">
              Install Chrome extension
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-ink-muted hover:bg-cream-2 hover:text-ink transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="text-ink-muted text-sm mb-6">
            The extension lets you save recipes from any recipe page or Instagram with one click. Chrome only (desktop).
          </p>
          <ol className="space-y-4">
            {STEPS.map(({ n, title, text }) => (
              <li key={n} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sage text-white text-sm font-medium flex items-center justify-center">
                  {n}
                </span>
                <div>
                  <p className="font-medium text-ink">{title}</p>
                  <p className="text-sm text-ink-muted mt-0.5">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-ink-muted">
            You need the Kliek project source (e.g. from GitHub) to get the <code className="bg-cream-2 px-1.5 py-0.5 rounded">extension</code> folder. After loading it once, the extension stays installed until you remove it.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full px-4 py-2.5 rounded-xl bg-sage text-white font-medium hover:bg-sage-dark transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
