import { getMessageLogs, getSMSAnalytics } from '../actions'
import ReportsHeader from '../ReportsHeader'
import BatchAnalysisCard from '../BatchAnalysisCard'

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function BatchesPage({ searchParams }: Props) {
  const params = await searchParams
  const startDate = params.startDate
  const endDate = params.endDate

  const [logs, analytics] = await Promise.all([
    getMessageLogs(startDate, endDate),
    getSMSAnalytics(startDate, endDate),
  ])

  const { summary, carrierData, timelineData, batches } = analytics

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ReportsHeader
        activeTab="batches"
        summary={summary}
        carrierData={carrierData}
        timelineData={timelineData}
        logs={logs}
      />
      <BatchAnalysisCard batches={batches} />
    </div>
  )
}
