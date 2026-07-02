import { getMessageLogs, getSMSAnalytics, getAnomalyContacts } from '../actions'
import ReportsHeader from '../ReportsHeader'
import AnomalyContactsCard from '../AnomalyContactsCard'

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function AnomaliesPage({ searchParams }: Props) {
  const params = await searchParams
  const startDate = params.startDate
  const endDate = params.endDate

  const [logs, analytics, anomalies] = await Promise.all([
    getMessageLogs(startDate, endDate),
    getSMSAnalytics(startDate, endDate),
    getAnomalyContacts(),
  ])

  const { summary, carrierData, timelineData } = analytics

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ReportsHeader
        activeTab="anomalies"
        summary={summary}
        carrierData={carrierData}
        timelineData={timelineData}
        logs={logs}
      />
      <AnomalyContactsCard anomalies={anomalies} />
    </div>
  )
}
