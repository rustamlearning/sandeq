import { ReactNode } from 'react'

type EmptyType = 'kuis' | 'materi' | 'nilai' | 'notifikasi' | 'forum' | 'absensi' | 'pengumuman' | 'leaderboard' | 'generic'

const illustrations: Record<EmptyType, ReactNode> = {
  kuis: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#EFF6FF" />
      <rect x="35" y="30" width="50" height="62" rx="6" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5"/>
      <rect x="42" y="42" width="36" height="4" rx="2" fill="#93C5FD"/>
      <rect x="42" y="52" width="28" height="4" rx="2" fill="#BFDBFE"/>
      <rect x="42" y="62" width="32" height="4" rx="2" fill="#BFDBFE"/>
      <rect x="42" y="72" width="20" height="4" rx="2" fill="#DBEAFE"/>
      <circle cx="80" cy="80" r="14" fill="#3B82F6"/>
      <text x="80" y="85" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">?</text>
    </svg>
  ),
  materi: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#F0FDF4" />
      <rect x="28" y="38" width="44" height="52" rx="5" fill="#BBF7D0" stroke="#6EE7B7" strokeWidth="1.5"/>
      <rect x="35" y="28" width="44" height="52" rx="5" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1.5"/>
      <rect x="42" y="44" width="28" height="3.5" rx="2" fill="#6EE7B7"/>
      <rect x="42" y="52" width="22" height="3.5" rx="2" fill="#A7F3D0"/>
      <rect x="42" y="60" width="26" height="3.5" rx="2" fill="#A7F3D0"/>
      <rect x="42" y="68" width="16" height="3.5" rx="2" fill="#D1FAE5"/>
      <circle cx="82" cy="38" r="12" fill="#10B981"/>
      <path d="M77 38l3.5 3.5L87 34" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  nilai: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#FFFBEB" />
      <rect x="30" y="45" width="60" height="42" rx="6" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="1.5"/>
      <rect x="30" y="45" width="60" height="14" rx="6" fill="#FDE68A"/>
      <rect x="37" y="51" width="24" height="3" rx="1.5" fill="#F59E0B"/>
      <rect x="37" y="67" width="18" height="3" rx="1.5" fill="#FCD34D"/>
      <rect x="37" y="74" width="24" height="3" rx="1.5" fill="#FCD34D"/>
      <rect x="68" y="66" width="16" height="12" rx="3" fill="#F59E0B"/>
      <text x="76" y="76" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">A+</text>
    </svg>
  ),
  notifikasi: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#FFF7ED" />
      <path d="M60 32 C48 32 40 41 40 52 L40 68 L34 74 L86 74 L80 68 L80 52 C80 41 72 32 60 32Z" fill="#FED7AA" stroke="#FB923C" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="54" y="74" width="12" height="5" rx="2" fill="#FB923C"/>
      <circle cx="80" cy="34" r="8" fill="#EF4444"/>
      <text x="80" y="38" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">0</text>
    </svg>
  ),
  forum: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#F0F9FF" />
      <rect x="28" y="38" width="48" height="30" rx="8" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="1.5"/>
      <path d="M28 62 L40 72 L40 62" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="44" y="56" width="48" height="28" rx="8" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5"/>
      <path d="M92 78 L80 88 L80 78" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="36" y="46" width="20" height="3" rx="1.5" fill="#38BDF8"/>
      <rect x="36" y="52" width="14" height="3" rx="1.5" fill="#7DD3FC"/>
    </svg>
  ),
  absensi: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#F0FDF4" />
      <rect x="32" y="32" width="56" height="58" rx="7" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1.5"/>
      <rect x="32" y="32" width="56" height="16" rx="7" fill="#86EFAC"/>
      <rect x="44" y="26" width="6" height="14" rx="3" fill="#4ADE80"/>
      <rect x="70" y="26" width="6" height="14" rx="3" fill="#4ADE80"/>
      <path d="M46 64 l6 6 12-12" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M46 78 l6 6 12-12" stroke="#86EFAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pengumuman: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#FFF1F2" />
      <path d="M38 55 L52 55 L75 38 L75 82 L52 65 L38 65 Z" fill="#FECDD3" stroke="#FB7185" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="38" y="65" width="14" height="16" rx="2" fill="#FCA5A5"/>
      <path d="M80 50 Q88 60 80 70" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M83 44 Q95 58 83 74" stroke="#FECDD3" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  leaderboard: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#FFFBEB" />
      <rect x="42" y="52" width="18" height="34" rx="3" fill="#FDE68A" stroke="#FCD34D" strokeWidth="1.5"/>
      <rect x="28" y="62" width="18" height="24" rx="3" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5"/>
      <rect x="74" y="68" width="18" height="18" rx="3" fill="#FED7AA" stroke="#FDBA74" strokeWidth="1.5"/>
      <circle cx="51" cy="44" r="7" fill="#F59E0B"/>
      <text x="51" y="48" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">1</text>
    </svg>
  ),
  generic: (
    <svg viewBox="0 0 120 120" className="w-28 h-28" fill="none">
      <circle cx="60" cy="60" r="50" fill="#F8FAFC" />
      <circle cx="60" cy="52" r="18" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5"/>
      <circle cx="60" cy="52" r="8" fill="#94A3B8"/>
      <path d="M38 86 C38 74 82 74 82 86" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
}

interface EmptyStateProps {
  type?: EmptyType
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ type = 'generic', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center animate-fade-in-up">
      <div className="mb-4 opacity-90">{illustrations[type]}</div>
      <h3 className="font-semibold text-slate-700 text-base mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
