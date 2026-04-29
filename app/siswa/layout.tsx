import SiswaBottomNav from '@/components/SiswaBottomNav'

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-16 md:pb-0">{children}</div>
      <SiswaBottomNav />
    </>
  )
}
