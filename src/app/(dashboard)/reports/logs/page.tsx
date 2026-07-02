import { getMessageLogs } from '../actions'
import ReportsHeader from '../ReportsHeader'
import MessageLogTable from '../MessageLogTable'

interface Props {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function LogsPage({ searchParams }: Props) {
  const params = await searchParams
  const startDate = params.startDate
  const endDate = params.endDate

  const logs = await getMessageLogs(startDate, endDate)

  return (
    <div className="flex flex-col gap-8 pb-12">
      <ReportsHeader
        activeTab="logs"
        logs={logs}
      />
      <MessageLogTable initialLogs={logs} />
    </div>
  )
}
