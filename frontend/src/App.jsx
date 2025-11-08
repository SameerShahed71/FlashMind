import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:3000/generate'
const initialToast = { type: null, message: '' }

function App() {
  const [pdfFile, setPdfFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(initialToast)

  useEffect(() => {
    if (!toast.type) return
    const timeout = setTimeout(() => setToast(initialToast), 4000)
    return () => clearTimeout(timeout)
  }, [toast])

  const showToast = (type, message) => setToast({ type, message })

  const handleGenerate = async () => {
    if (!notes.trim() && !pdfFile) {
      showToast('error', 'Add a PDF or paste some notes before generating.')
      return
    }

    setLoading(true)
    showToast(null, '')

    try {
      let response

      if (pdfFile) {
        const formData = new FormData()
        formData.append('pdf', pdfFile)
        response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
        })
      } else {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: notes }),
        })
      }

      if (!response.ok) {
        throw new Error('The backend responded with an error.')
      }

      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response format from backend.')
      }

      setFlashcards(data)
      if (data.length === 0) {
        showToast('error', 'No flashcards generated. Provide more information in your notes or try a different PDF.')
      } else{
        showToast('success', `Generated ${data.length} flashcards.`)
      }
    } catch (error) {
      console.error(error)
      showToast('error', error.message || 'Something went wrong while generating flashcards.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setPdfFile(null)
    setNotes('')
    setFlashcards([])
    showToast('info', 'Workspace cleared.')
  }

  const handleCopyAll = async () => {
    if (!flashcards.length) return

    const text = flashcards
      .map((card, index) => `Card ${index + 1}\nQ: ${card.question}\nA: ${card.answer}`)
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(text)
      showToast('success', 'All flashcards copied to clipboard.')
    } catch (error) {
      console.error(error)
      showToast('error', 'Clipboard copy failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white px-4 py-10">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        {toast.type && (
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(initialToast)} />
        )}

        <section className="rounded-3xl bg-white p-8 shadow-2xl shadow-indigo-100/60 ring-1 ring-slate-100">
          <div className="text-center">
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">FlashMind 🔮</h1>
            <p className="mt-2 text-base text-slate-500">Turn your notes into flashcards</p>
            <p className="mt-1 text-sm text-slate-400">
              Upload a PDF lecture deck or paste your notes below. We'll generate smart cards you can study instantly.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <UploadArea file={pdfFile} onFileSelect={setPdfFile} />

            <div>
              <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-slate-700">
                Paste notes or lecture summaries
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Paste your notes here..."
                className="h-48 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-200"
              />
              <p className="mt-2 text-xs text-slate-400">
                Supports Markdown, bullet lists, and prose. Minimum one sentence recommended.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Spinner /> Generating...
                  </>
                ) : (
                  'Generate Flashcards'
                )}
              </button>
            </div>
          </div>
        </section>

        {flashcards.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Generated cards</h2>
                <p className="text-sm text-slate-500">Tap a card to reveal its answer.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                >
                  Copy All
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Clear
                </button>
              </div>
            </div>
            <FlashcardGrid flashcards={flashcards} />
          </section>
        )}
      </main>
    </div>
  )
}

function UploadArea({ file, onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)

    const droppedFile = event.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      onFileSelect(droppedFile)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-2 border-dashed p-6 transition ${
        isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50/60'
      }`}
    >
      <label className="flex cursor-pointer flex-col items-center gap-3 text-center" htmlFor="pdf-upload">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-6 w-6 text-indigo-500"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 16V4m0 0 3.5 3.5M12 4 8.5 7.5M6 16h12m-12 4h12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Upload a PDF (drag &amp; drop)</p>
          <p className="text-xs text-slate-500">Supports up to 20MB. Only .pdf files.</p>
        </div>
      </label>

      <input
        id="pdf-upload"
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files?.[0]
          if (selected) {
            onFileSelect(selected)
          }
        }}
      />

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            className="text-xs font-semibold text-rose-500 hover:text-rose-600"
            onClick={() => onFileSelect(null)}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

function FlashcardGrid({ flashcards }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {flashcards.map((card, index) => (
        <Flashcard key={`${card.question}-${index}`} card={card} index={index} />
      ))}
    </div>
  )
}

function Flashcard({ card, index }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setRevealed((prev) => !prev)}
      className="group h-full rounded-3xl border border-slate-100 bg-white/90 p-5 text-left shadow-lg shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      aria-expanded={revealed}
    >
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>Card {index + 1}</span>
        <span className="font-semibold text-indigo-500">{revealed ? 'Hide' : 'Reveal'}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{card.question}</p>
      <p
        className={`mt-3 text-sm leading-relaxed text-slate-700 transition-all duration-200 ${
          revealed ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {card.answer}
      </p>
      {!revealed && <p className="mt-3 text-xs font-medium text-indigo-500">Tap to show answer</p>}
    </button>
  )
}

function Toast({ type, message, onClose }) {
  const palette = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    info: 'bg-slate-50 border-slate-200 text-slate-700',
  }

  return (
    <div
      className={`fixed right-6 top-6 z-50 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg ${palette[type]}`}
      role="status"
    >
      <p className="font-medium">{message}</p>
      {/* <button
        type="button"
        className="text-xs font-semibold opacity-60 transition hover:opacity-100"
        onClick= {onClose}
      >
        Close
      </button> */}
    </div>
  )
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
      aria-hidden="true"
    />
  )
}

export default App
