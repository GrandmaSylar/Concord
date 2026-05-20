import { getTemplates } from '../templates/actions'
import { getContactFilterOptions } from '../contacts/actions'
import SendMessageForm from './SendMessageForm'

export default async function SendSMSPage() {
  const [templates, filterOptions] = await Promise.all([
    getTemplates(),
    getContactFilterOptions()
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Send SMS</h1>
        <p className="text-sm text-gray-500 mt-1">Compose and send messages to your contacts.</p>
      </div>
      
      <div>
        <SendMessageForm 
          availableTemplates={templates} 
          filterOptions={filterOptions} 
        />
      </div>
    </div>
  )
}
