import { getMessageLogs, getAnomalyContacts } from '../actions'
import ReportsHeader from '../ReportsHeader'
import AnomalyContactsCard from '../AnomalyContactsCard'

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function AnomaliesPage({ searchParams }: Props) {
  const params = await searchParams
  const startDate = params.startDate
  const endDate = params.endDate

  const [logs, anomalies] = await Promise.all([
    getMessageLogs(startDate, endDate),
    getAnomalyContacts(),
  ])

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ReportsHeader
        activeTab="anomalies"
        logs={logs}
      />
      <AnomalyContactsCard anomalies={anomalies} />
    </div>
  )
}
