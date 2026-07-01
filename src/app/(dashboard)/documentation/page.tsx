'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Lock, 
  LayoutDashboard, 
  Users, 
  Send, 
  FileText, 
  Clock, 
  BarChart2, 
  GitBranch, 
  ChevronRight, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react'

const SECTIONS = [
  {
    id: 'auth',
    title: 'Logging In & Security',
    icon: Lock,
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          The platform uses high security standards to keep your contacts and messages protected.
        </p>
        <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Password Security Checks
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            All user accounts must set a secure password upon logging in for the first time. Your password must check the following rules:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium list-disc list-inside">
            <li>At least 8 characters long</li>
            <li>Contains at least one uppercase letter (A-Z)</li>
            <li>Contains at least one lowercase letter (a-z)</li>
            <li>Contains at least one number (0-9)</li>
            <li>Contains at least one special symbol (like @, $, !, %, *, ?, &)</li>
          </ul>
        </div>
        <div className="border border-slate-100 rounded-xl p-4 bg-amber-50/50 text-xs text-amber-800 leading-relaxed">
          <strong>Locked Out?</strong> If you enter the wrong password 5 times in a row, the system will lock your account for a short time to protect it. The first lock lasts 30 seconds and doubles with each additional locked try (1 minute, 2 minutes, etc.).
        </div>
      </div>
    )
  },
  {
    id: 'dashboard',
    title: 'The Dashboard',
    icon: LayoutDashboard,
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          The Dashboard is the home page. It shows you how many contacts you have and how your messages are sending.
        </p>
        <ul className="space-y-2.5 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-800 min-w-[120px]">Total Constituents:</span> 
            <span>The total number of contacts saved in your database.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-800 min-w-[120px]">Deliverability:</span> 
            <span>The total count of messages successfully delivered to your recipients.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-800 min-w-[120px]">Queue Monitor:</span> 
            <span>A real-time progress box showing messages as they send. It updates every 3 seconds to show pending, processing, delivered, and failed messages.</span>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'contacts',
    title: 'Managing Contacts',
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          You can add, search, categorize, and import contacts in your list.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="border border-slate-100 rounded-lg p-3 bg-white">
            <span className="font-bold text-slate-800 block mb-1">Importing Spreadsheet Lists</span>
            <span className="text-slate-500">Upload bulk sheets. Ensure columns have headers like Name and Phone. The system reads them automatically and creates the entries.</span>
          </div>
          <div className="border border-slate-100 rounded-lg p-3 bg-white">
            <span className="font-bold text-slate-800 block mb-1">Opting Out Contacts</span>
            <span className="text-slate-500">Toggle the switch next to any contact. When crossed out, the system blocks all message dispatches to that number.</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'constituency',
    title: 'Constituency Filters',
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          The Constituency tab helps you find and filter specific groups of people in the Drybone area.
        </p>
        <ul className="list-disc list-inside text-xs text-slate-600 space-y-2 leading-relaxed">
          <li><strong>Neighborhood / Sub-Area:</strong> Click any area button to view only contacts living there.</li>
          <li><strong>Job Roles:</strong> Filter contacts by their position (e.g. view only "Chairmen").</li>
          <li><strong>Polling Stations:</strong> Select a polling station from the dropdown to see registered voters at that station.</li>
          <li><strong>Missing Info Alerts:</strong> Instantly view contacts who are missing phone numbers or voter IDs so you can clean up your list.</li>
          <li><strong>Group Dispatch:</strong> Select the matching group and click the green <em>Send SMS to Selected</em> button to load them into the composer.</li>
        </ul>
      </div>
    )
  },
  {
    id: 'campaigns',
    title: 'Sending Campaigns',
    icon: Send,
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          Compose and dispatch bulk messages to your contacts or lists of numbers.
        </p>
        <div className="space-y-3 text-xs">
          <div className="border-l-4 border-blue-500 pl-3">
            <strong className="text-slate-800 block">Personalizing Messages (Placeholders)</strong>
            <span className="text-slate-500">Insert tag buttons like <code>[Firstname]</code> or <code>[SubArea]</code>. The system automatically replaces them with each contact's own details when sending.</span>
          </div>
          <div className="border-l-4 border-indigo-500 pl-3">
            <strong className="text-slate-800 block">Sender IDs (Who it is from)</strong>
            <span className="text-slate-500">Choose between pre-configured names: <strong>Rachael-RTK</strong> (Official), <strong>RachaelWG</strong> (Campaign route), or <strong>RTK4SERVICE</strong> (General alerts).</span>
          </div>
          <div className="border-l-4 border-emerald-500 pl-3">
            <strong className="text-slate-800 block">Temporary Phone Numbers</strong>
            <span className="text-slate-500">Paste lists of numbers in the temporary box separated by commas. The system sends messages to them without saving them as contacts.</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'templates',
    title: 'Templates',
    icon: FileText,
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          Create reusable drafts so you do not have to type the same message multiple times.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Organize them by using prefix tags in your template names:
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">[Mobilization] Event details</span>
          <span className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">[Outreach] Broadcasts</span>
          <span className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">[Voter Care] Greetings</span>
          <span className="px-2 py-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded">[Training] Staff notes</span>
        </div>
      </div>
    )
  },
  {
    id: 'reminders',
    title: 'Scheduling Messages',
    icon: Clock,
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          Schedule messages to be sent automatically at a future date and time.
        </p>
        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
          <li>Select the date and time for delivery</li>
          <li>Choose your target contact group</li>
          <li>Compose your message and click schedule</li>
        </ul>
      </div>
    )
  },
  {
    id: 'reports',
    title: 'Delivery Reports',
    icon: BarChart2,
    content: (
      <div className="space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          Review past message dispatches, confirm delivery states, and audit sent records.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Search logs by typing a phone number or part of the message to check if it was delivered or failed.
        </p>
      </div>
    )
  },
  {
    id: 'version',
    title: 'System Release History',
    icon: GitBranch,
    content: (
      <div className="space-y-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-800 text-sm">Release Version 1.0.0</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold">Stable</span>
          </div>
          <div className="p-4 space-y-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Updates Included:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>Clean, light layout colors applied.</li>
              <li>Database performance optimizations for fast searches.</li>
              <li>Floating AI compose assistant added to compose screen.</li>
              <li>Mandatory secure password reset flow enabled for logins.</li>
              <li>Gateway API connection configured for deliveries.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
]

export default function DocumentationPage() {
  const [activeId, setActiveId] = useState('auth')

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          Concord User Guide & Help Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Simple step-by-step guides to help you use every feature of the Concord platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Left Navigation Menu */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 space-y-1 shadow-sm md:col-span-1">
          {SECTIONS.map((sec) => {
            const ActiveIcon = sec.icon
            return (
              <button
                key={sec.id}
                onClick={() => setActiveId(sec.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeId === sec.id
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ActiveIcon className={`w-4 h-4 ${activeId === sec.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  {sec.title}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeId === sec.id ? 'translate-x-0.5' : 'opacity-0'}`} />
              </button>
            )
          })}
        </div>

        {/* Right Content Panels */}
        <div className="md:col-span-3">
          {SECTIONS.map((sec) => {
            if (sec.id !== activeId) return null
            const TitleIcon = sec.icon
            return (
              <div 
                key={sec.id} 
                className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm space-y-5 animate-in slide-in-from-bottom-2 duration-200"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <TitleIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-950 tracking-tight">{sec.title}</h2>
                </div>
                {sec.content}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
