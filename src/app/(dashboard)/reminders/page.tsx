import { getContacts } from '../contacts/actions'
import AddReminderForm from './AddReminderForm'

export default async function RemindersPage() {
  const contacts = await getContacts()
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Automated Reminders</h1>
        <p className="text-sm text-gray-500 mt-1">Set up specific future messages for individual contacts.</p>
      </div>
      
      <div className="max-w-2xl">
        <AddReminderForm contacts={contacts} />
      </div>
    </div>
  )
}
