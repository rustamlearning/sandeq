'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Inbox,
  Loader2,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { supabase, User, Absensi } from '@/lib/supabase'

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  hadir: { label: 'Hadir', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  sakit: { label: 'Sakit', bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
  izin:  { label: 'Izin',  bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'   },
  alpha: { label: 'Alpha', bg: 'bg-red-100',      text: 'text-red-700',    dot: 'bg-red-500'    },
}

function getWeekNumber(date: Date) {
  const d = new Date(date); d.setHours(0,0,0,0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const y = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d.getTime() - y.getTime()) / 86400000) + 1) / 7)
}
function getMonthKey(s: string) { return s.substring(0, 7) }
function getWeekKey(s: string) {
  const d = new Date(s + 'T00:00:00')
  return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2,'0')}`
}
function weekLabel(wk: string) {
  const [year, wStr] = wk.split('-W'); const w = parseInt(wStr)
  const jan1 = new Date(parseInt(year), 0, 1)
  const dow = jan1.getDay() || 7
  const mon = new Date(jan1.getTime() + ((w-1)*7-(dow-1))*86400000)
  const sat = new Date(mon.getTime() + 5*86400000)
  const fmt = (d: Date) => d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})
  return `${fmt(mon)} – ${fmt(sat)}`
}

export default function AbsensiSiswaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Absensi[]>([])
  const [activeTab, setActiveTab] = useState<'bulan'|'minggu'|'riwayat'>('bulan')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`
  })

  useEffect(() => {
    async function init() {
      const u = await getCurrentUser()
      if (!u || u.role !== 'siswa') { router.replace('/login'); return }
      const { data } = await supabase.from('absensi').select('*').eq('siswa_id', u.id).order('tanggal',{ascending:false})
      setList(data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const total = list.length
  const stats = {
    hadir: list.filter(r=>r.status==='hadir').length,
    sakit: list.filter(r=>r.status==='sakit').length,
    izin:  list.filter(r=>r.status==='izin').length,
    alpha: list.filter(r=>r.status==='alpha').length,
  }
  const pct = total > 0 ? Math.round(stats.hadir/total*100) : 0
  const barColor = pct>=90?'bg-emerald-400':pct>=75?'bg-yellow-400':'bg-red-400'
  const pctColor = pct>=90?'text-emerald-300':pct>=75?'text-yellow-300':'text-red-300'

  const byMonth: Record<string,Absensi[]> = {}
  const byWeek:  Record<string,Absensi[]> = {}
  list.forEach(a => {
    const mk = getMonthKey(a.tanggal); if(!byMonth[mk]) byMonth[mk]=[];  byMonth[mk].push(a)
    const wk = getWeekKey(a.tanggal);  if(!byWeek[wk])  byWeek[wk]=[];   byWeek[wk].push(a)
  })
  const monthKeys = Object.keys(byMonth).sort().reverse()
  const weekKeys  = Object.keys(byWeek).sort().reverse()

  const [sy, sm] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(sy, sm, 0).getDate()
  const firstDow = new Date(sy, sm-1, 1).getDay() || 7
  const monthRecords = byMonth[selectedMonth] || []
  const dayMap: Record<string,string> = {}
  monthRecords.forEach(a => { dayMap[a.tanggal.substring(8,10)] = a.status })

  function statsFor(recs: Absensi[]) {
    return {
      hadir: recs.filter(r=>r.status==='hadir').length,
      sakit: recs.filter(r=>r.status==='sakit').length,
      izin:  recs.filter(r=>r.status==='izin').length,
      alpha: recs.filter(r=>r.status==='alpha').length,
      total: recs.length,
    }
  }

  function prevMonth() {
    const d = new Date(sy, sm-2, 1)
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }
  function nextMonth() {
    const d = new Date(sy, sm, 1)
    const now = new Date()
    if (d <= now) setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F9FF]">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Loader2 className="animate-spin" size={24} />
        </div>
        <p className="text-gray-500">Memuat...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-500 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/siswa')} aria-label="Kembali"
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Absensi Saya</h1>
            <p className="text-white/70 text-xs">{total} hari tercatat</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="bg-white/15 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-sm">Kehadiran Keseluruhan</p>
              <p className={`font-bold text-2xl ${pctColor}`}>{pct}%</p>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{width:`${pct}%`}} />
            </div>
            <div className="flex gap-3 mt-2 text-xs text-white/70 flex-wrap">
              <span>{stats.hadir} hadir</span>
              <span>{stats.sakit} sakit</span>
              <span>{stats.izin} izin</span>
              <span>{stats.alpha} alpha</span>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {(['bulan','minggu','riwayat'] as const).map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${activeTab===tab?'bg-white text-blue-700':'bg-white/20 text-white hover:bg-white/30'}`}>
              <span className="inline-flex items-center justify-center gap-1.5">
                {tab === 'bulan' ? <CalendarDays size={15} /> : tab === 'minggu' ? <CalendarRange size={15} /> : <ClipboardList size={15} />}
                {tab === 'bulan' ? 'Bulan' : tab === 'minggu' ? 'Minggu' : 'Riwayat'}
              </span>
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {activeTab === 'bulan' && (
          <div className="space-y-4">
            {/* Navigator bulan */}
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} aria-label="Bulan sebelumnya" className="w-9 h-9 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg">
                <ChevronLeft size={17} />
              </button>
              <div className="flex-1 text-center font-bold text-slate-700">
                {new Date(sy, sm-1, 1).toLocaleDateString('id-ID',{month:'long',year:'numeric'})}
              </div>
              <button onClick={nextMonth} aria-label="Bulan berikutnya" className="w-9 h-9 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg">
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Kalender */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((d,i) => (
                  <div key={d} className={`py-2 text-center text-xs font-semibold ${i>=6?'text-red-400':'text-slate-400'}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-50">
                {Array.from({length: firstDow-1}).map((_,i) => <div key={`e${i}`} className="bg-white h-10" />)}
                {Array.from({length: daysInMonth}).map((_,i) => {
                  const day = i+1
                  const ds = String(day).padStart(2,'0')
                  const status = dayMap[ds]
                  const date = new Date(sy, sm-1, day)
                  const isWeekend = date.getDay()===0
                  const isToday = date.toDateString()===new Date().toDateString()
                  const cfg = status ? STATUS_CONFIG[status] : null
                  return (
                    <div key={day} className={`bg-white h-12 flex flex-col items-center justify-center relative ${isWeekend?'opacity-50':''}`}>
                      {isToday && <div className="absolute inset-0.5 rounded-lg bg-emerald-50 border border-emerald-200" />}
                      <span className={`relative text-xs font-semibold z-10 ${cfg?cfg.text:isToday?'text-blue-600':isWeekend?'text-red-400':'text-slate-600'}`}>{day}</span>
                      {cfg && <div className={`relative w-1.5 h-1.5 rounded-full ${cfg.dot} z-10 mt-0.5`} />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 px-1">
              {Object.entries(STATUS_CONFIG).map(([k,cfg]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className="text-xs text-slate-500">{cfg.label}</span>
                </div>
              ))}
            </div>

            {/* Rekap bulan */}
            {monthRecords.length > 0 ? (() => {
              const ms = statsFor(monthRecords)
              const mp = ms.total>0?Math.round(ms.hadir/ms.total*100):0
              return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                  <p className="text-sm font-bold text-slate-700 mb-3">Rekap Bulan Ini</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {Object.entries(STATUS_CONFIG).map(([k,cfg]) => (
                      <div key={k} className={`${cfg.bg} rounded-xl p-2.5 text-center`}>
                        <p className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</p>
                        <p className={`text-xl font-black ${cfg.text}`}>{ms[k as keyof typeof ms]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Kehadiran bulan ini</span><span className="font-bold">{mp}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${mp>=90?'bg-emerald-400':mp>=75?'bg-yellow-400':'bg-red-400'}`} style={{width:`${mp}%`}} />
                  </div>
                </div>
              )
            })() : (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                  <Inbox size={22} />
                </div>
                <p className="text-slate-500 text-sm">Tidak ada data absensi bulan ini</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'minggu' && (
          <div className="space-y-3">
            {weekKeys.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                  <Inbox size={22} />
                </div>
                <p className="text-slate-500 text-sm">Belum ada data</p>
              </div>
            ) : weekKeys.map(wk => {
              const ws = statsFor(byWeek[wk])
              const wp = ws.total>0?Math.round(ws.hadir/ws.total*100):0
              return (
                <div key={wk} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-400">Minggu</p>
                      <p className="text-sm font-bold text-slate-700">{weekLabel(wk)}</p>
                    </div>
                    <span className={`text-sm font-black px-3 py-1.5 rounded-xl ${wp>=90?'bg-emerald-100 text-emerald-700':wp>=75?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{wp}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {Object.entries(STATUS_CONFIG).map(([k,cfg]) => (
                      <div key={k} className={`${cfg.bg} rounded-lg p-2 text-center`}>
                        <p className={`text-[10px] font-medium ${cfg.text}`}>{cfg.label}</p>
                        <p className={`text-lg font-black ${cfg.text}`}>{ws[k as keyof typeof ws]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${wp>=90?'bg-emerald-400':wp>=75?'bg-yellow-400':'bg-red-400'}`} style={{width:`${wp}%`}} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'riwayat' && (
          <div className="space-y-4">
            {list.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                  <FileText size={22} />
                </div>
                <p className="text-slate-500 text-sm">Belum ada catatan</p>
              </div>
            ) : monthKeys.map(mk => {
              const recs = byMonth[mk]
              const [my, mm] = mk.split('-').map(Number)
              const label = new Date(my,mm-1,1).toLocaleDateString('id-ID',{month:'long',year:'numeric'})
              const ms = statsFor(recs)
              const mp = ms.total>0?Math.round(ms.hadir/ms.total*100):0
              return (
                <div key={mk} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-700">{label}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${mp>=90?'bg-emerald-100 text-emerald-700':mp>=75?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{mp}% hadir</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {recs.map(a => {
                      const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.hadir
                      return (
                        <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                          <p className="flex-1 text-sm text-slate-700">
                            {new Date(a.tanggal+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})}
                          </p>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
