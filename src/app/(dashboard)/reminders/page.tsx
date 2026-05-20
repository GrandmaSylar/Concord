import { getContactFilterOptions } from '../contacts/actions'
import AddReminderForm from './AddReminderForm'

export default async function RemindersPage() {
  const filterOptions = await getContactFilterOptions()
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Automated Reminders</h1>
        <p className="text-sm text-gray-500 mt-1">Set up specific future messages for selected contacts.</p>
      </div>
      
      <div>
        <AddReminderForm filterOptions={filterOptions} />
      </div>
    </div>
  )
}
