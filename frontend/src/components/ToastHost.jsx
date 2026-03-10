import { Toaster } from 'react-hot-toast'

export default function ToastHost() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgba(24,24,27,.72)',
          color: 'white',
          border: '1px solid rgba(255,255,255,.10)',
          backdropFilter: 'blur(16px)',
        },
      }}
    />
  )
}

