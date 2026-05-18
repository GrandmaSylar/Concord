'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { bulkImportContacts } from './actions'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function ImportContacts() {
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Expected columns: Name, Phone, Group
        const contacts = results.data.map((row: any) => ({
          name: row['Name'] || row['name'] || '',
          phone: row['Phone'] || row['phone'] || '',
          group_name: row['Group'] || row['group'] || 'Imported',
        })).filter(c => c.name && c.phone)

        if (contacts.length === 0) {
          toast.error('No valid contacts found. Please ensure CSV has Name and Phone columns.')
          setLoading(false)
          return
        }

        const res = await bulkImportContacts(contacts)
        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success(`Successfully imported ${contacts.length} contacts!`)
        }
        setLoading(false)
        event.target.value = '' // Reset input
      },
      error: (err) => {
        toast.error('Failed to parse CSV file.')
        setLoading(false)
      }
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-gray-500" />
        Import from CSV
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Upload a CSV file with <code>Name</code>, <code>Phone</code>, and optional <code>Group</code> columns.
      </p>

      <div className="flex items-center justify-center w-full">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all duration-200 hover:shadow-sm">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
            <p className="text-xs text-gray-500">CSV files only</p>
          </div>
          <input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={loading} />
        </label>
      </div>

      {loading && <p className="mt-4 text-sm text-blue-600 font-medium text-center">Processing CSV, please wait...</p>}
    </div>
  )
}
