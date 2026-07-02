import { getMessageLogs, getSMSAnalytics, getFailedMessageLogs } from '../actions'
import ReportsHeader from '../ReportsHeader'
import FailedMessagesCard from '../FailedMessagesCard'

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function RetryPage({ searchParams }: Props) {
  const params = await searchParams
  const startDate = params.startDate
  const endDate = params.endDate

  const [logs, analytics, failedLogs] = await Promise.all([
    getMessageLogs(startDate, endDate),
    getSMSAnalytics(startDate, endDate),
    getFailedMessageLogs(startDate, endDate),
  ])

  const { summary, carrierData, timelineData } = analytics

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ReportsHeader
        activeTab="retry"
        summary={summary}
        carrierData={carrierData}
        timelineData={timelineData}
        logs={logs}
      />
      <FailedMessagesCard failedLogs={failedLogs} />
    </div>
  )
}
