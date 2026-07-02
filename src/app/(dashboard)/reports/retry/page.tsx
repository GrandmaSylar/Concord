import { getMessageLogs, getFailedMessageLogs } from '../actions'
import ReportsHeader from '../ReportsHeader'
import FailedMessagesCard from '../FailedMessagesCard'

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function RetryPage({ searchParams }: Props) {
  const params = await searchParams
  const startDate = params.startDate
  const endDate = params.endDate

  const [logs, failedLogs] = await Promise.all([
    getMessageLogs(startDate, endDate),
    getFailedMessageLogs(startDate, endDate),
  ])

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ReportsHeader
        activeTab="retry"
        logs={logs}
      />
      <FailedMessagesCard failedLogs={failedLogs} />
    </div>
  )
}
