import { getUpcomingReminders } from '../reminders/actions'
import ScheduledQueue from './ScheduledQueue'

export default async function ScheduledPage() {
  const reminders = await getUpcomingReminders()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Scheduled Messages</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage campaigns and reminders scheduled for the future.</p>
      </div>
      
      <div className="max-w-4xl">
        <ScheduledQueue reminders={reminders} />
      </div>
    </div>
  )
}
