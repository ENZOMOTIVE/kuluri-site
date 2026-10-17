import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="toast" role="status">
      <CheckCircle2 size={20} className="toast-icon" />
      <span>{message}</span>
      <button className="icon-btn" onClick={onClose} aria-label="Close">
        <X size={16} />
      </button>
      <div className="toast-bar" />
    </div>
  )
}
