import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'warning'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:bg-indigo-300 disabled:shadow-none',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm disabled:opacity-50',
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
  ({ variant = 'primary', size = 'md', loading, fullWidth, icon, children, className = '', disabled, ...props }, ref) => {
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
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-current"
                  style={{ animation: `loadingDot 1.15s ease-in-out ${i * 0.14}s infinite` }}
                />
              ))}
            </span>
            <span>{children}</span>
          </>
        ) : (<>{icon && <span className='flex-shrink-0'>{icon}</span>}{children}</>)}
      </button>
    )
  }
)

Button.displayName = 'Button'
