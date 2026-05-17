'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteTemplate } from './actions'

interface Template {
  id: string
  name: string
  content: string
  created_at: string
}

export default function TemplateList({ templates }: { templates: Template[] }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      startTransition(async () => {
        await deleteTemplate(id)
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="font-medium text-gray-900">Saved Templates</h3>
      </div>
      
      {templates.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No templates found. Create one to get started.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {templates.map(template => (
            <li key={template.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-start">
              <div className="flex-1 pr-4">
                <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{template.content}</p>
              </div>
              <button
                onClick={() => handleDelete(template.id)}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                title="Delete template"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
