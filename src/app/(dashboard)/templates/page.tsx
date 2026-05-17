import { getTemplates } from './actions'
import AddTemplateForm from './AddTemplateForm'
import TemplateList from './TemplateList'

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Templates</h1>
        <p className="text-sm text-gray-500 mt-1">Manage reusable message templates for your campaigns.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TemplateList templates={templates} />
        </div>
        <div>
          <AddTemplateForm />
        </div>
      </div>
    </div>
  )
}
