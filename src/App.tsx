import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

export function App() {
  const [appName] = useState('Desktop Photo Text Editor')

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-900 text-slate-100">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2 font-semibold">
          <ImageIcon className="h-5 w-5 text-indigo-400" />
          <span>{appName}</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="text-center text-slate-400">
          <p className="text-lg">Selamat Datang di {appName}</p>
          <p className="text-sm">Siap untuk memproses dan menambahkan teks ke foto.</p>
        </div>
      </main>
    </div>
  )
}

export default App
