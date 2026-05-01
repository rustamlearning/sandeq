import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#1a4a7a] text-white shadow-[0_14px_28px_rgba(26,74,122,0.20)] hover:bg-[#153f68] disabled:bg-[#8fb0ca] disabled:shadow-none',
  secondary: 'bg-white/86 text-slate-700 border border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-sm disabled:opacity-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-white/70 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_14px_28px_rgba(220,38,38,0.16)] disabled:opacity-50',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_14px_28px_rgba(5,150,105,0.16)] disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-md gap-2',
  lg: 'px-6 py-3 text-base rounded-lg gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center font-semibold transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2e86c1]/18 active:translate-y-0 select-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{children}</span>
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
