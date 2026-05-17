import { getDashboardStats } from './reports/actions'
import { Users, Send, Clock, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardOverview() {
  const stats = await getDashboardStats()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to Concord SMS. Here is a summary of your account activity.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Messages Sent</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMessagesSent}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Reminders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingReminders}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/send" className="flex items-center justify-center py-3 px-4 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-sm font-medium text-slate-700 border border-slate-200 transition-colors">
              Send a Campaign
            </Link>
            <Link href="/contacts" className="flex items-center justify-center py-3 px-4 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-sm font-medium text-slate-700 border border-slate-200 transition-colors">
              Import Contacts
            </Link>
            <Link href="/reminders" className="flex items-center justify-center py-3 px-4 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-sm font-medium text-slate-700 border border-slate-200 transition-colors">
              Schedule Reminder
            </Link>
            <Link href="/templates" className="flex items-center justify-center py-3 px-4 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-sm font-medium text-slate-700 border border-slate-200 transition-colors">
              Create Template
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
