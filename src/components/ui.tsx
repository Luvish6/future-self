import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export { cx }

export function Page({ title, subtitle, actions, children, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; back?: string }) {
  return (
    <div className="animate-rise mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">
      {back && (
        <Link to={back} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <Icon name="back" className="size-4" /> Back
        </Link>
      )}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </header>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

export function Section({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h2 className="text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Card({ children, className, as: As = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' | 'article' }) {
  return <As className={cx('rounded-2xl border border-line bg-surface/80 p-4 shadow-[0_1px_2px_rgba(0,0,0,.03)] backdrop-blur md:p-5', className)}>{children}</As>
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' | 'ghost' | 'danger'; icon?: IconName; size?: 'sm' | 'md' }
export function Button({ variant = 'primary', icon, size = 'md', className, children, type = 'button', ...rest }: BtnProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5',
        variant === 'primary' && 'bg-accent text-accent-ink hover:brightness-110',
        variant === 'soft' && 'bg-accent-soft text-accent hover:brightness-95 dark:hover:brightness-125',
        variant === 'ghost' && 'text-muted hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'bg-danger/10 text-danger hover:bg-danger/20',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} className={size === 'sm' ? 'size-4' : 'size-5'} />}
      {children}
    </button>
  )
}

export function IconButton({ icon, label, onClick, active, className }: { icon: IconName; label: string; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className={cx('grid size-9 place-items-center rounded-full transition hover:bg-surface-2', active ? 'text-accent' : 'text-muted hover:text-ink', className)}>
      <Icon name={icon} className="size-[18px]" filled={active && (icon === 'star' || icon === 'heart')} />
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

export function Empty({ icon, title, children, action }: { icon: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><Icon name={icon} /></div>
      <p className="font-medium">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  const cls = cx('rounded-full border px-3 py-1 text-sm transition', active ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:text-ink')
  return onClick ? <button type="button" aria-pressed={active} className={cls} onClick={onClick}>{children}</button> : <span className={cls}>{children}</span>
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-gradient-to-r from-accent to-warm transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p className={cx('rounded-xl px-4 py-3 text-sm', tone === 'warn' ? 'bg-warm/10 text-ink' : 'bg-accent-soft/60 text-ink')}>{children}</p>
  )
}

export function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-surface-2 p-1">
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}
          className={cx('rounded-full px-3.5 py-1.5 text-sm transition', o.value === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
