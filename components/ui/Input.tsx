import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const baseInput = 'w-full bg-white/92 border border-slate-200 rounded-md px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition duration-200 focus:border-[#2e86c1] focus:ring-4 focus:ring-[#2e86c1]/14 disabled:bg-slate-50 disabled:text-slate-400'

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <input
        ref={ref}
        className={[baseInput, error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : '', className].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select
        ref={ref}
        className={[baseInput, 'appearance-none cursor-pointer', error ? 'border-red-400' : '', className].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        ref={ref}
        className={[baseInput, 'resize-none', error ? 'border-red-400' : '', className].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

export function Badge({ children, color = 'blue', className = '' }: { children: React.ReactNode; color?: 'blue' | 'green' | 'orange' | 'red' | 'violet' | 'slate'; className?: string }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-100',
    violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
    slate: 'bg-slate-100/80 text-slate-600 ring-1 ring-slate-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}
