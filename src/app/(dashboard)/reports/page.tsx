import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const sp = new URLSearchParams()
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  
  const qs = sp.toString()
  redirect(`/reports/batches${qs ? `?${qs}` : ''}`)
}
