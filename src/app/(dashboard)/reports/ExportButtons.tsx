'use client'

import { FileText, Download, Printer, Table } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { toast } from 'sonner'

interface MessageLog {
  id: string
  recipient: string
  content: string
  status: string
  sent_at: string
  sender_id: string | null
}

interface ExportButtonsProps {
  logs: MessageLog[]
  summary: {
    total: number
    sent: number
    failed: number
    pending: number
    successRate: number
    estimatedCost: string
    totalSmsParts: number
  }
}

export default function ExportButtons({ logs, summary }: ExportButtonsProps) {
  
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs available to export.')
      return
    }

    const exportData = logs.map(log => ({
      Recipient: log.recipient,
      Status: log.status.toUpperCase(),
      Content: log.content,
      'Sender ID': log.sender_id || 'Rachael-RTK',
      'Sent At': new Date(log.sent_at).toLocaleString('en-GB')
    }))

    const csv = Papa.unparse(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `concord_sms_report_${new Date().toISOString().substring(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Successfully exported report to CSV!')
  }

  const handleExportExcel = () => {
    if (logs.length === 0) {
      toast.error('No logs available to export.')
      return
    }

    try {
      // 1. Create a workbook
      const wb = XLSX.utils.book_new()

      // 2. Sheet 1: Performance Summary Info
      const summaryRows = [
        ['CONCORD SMS GATEWAY CAMPAIGN REPORT'],
        ['Generated On:', new Date().toLocaleString('en-GB')],
        [],
        ['METRIC', 'VALUE'],
        ['Total SMS Dispatches', summary.total],
        ['Successfully Delivered', summary.sent],
        ['Failed Dispatches', summary.failed],
        ['Success Delivery Rate', `${summary.successRate}%`],
        ['Total SMS Parts Sent', summary.totalSmsParts],
        ['Estimated Cost (GHS)', `GH₵ ${summary.estimatedCost}`]
      ]
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Campaign Summary')

      // 3. Sheet 2: Audit Logs
      const logsData = logs.map(log => ({
        Recipient: log.recipient,
        Status: log.status.toUpperCase(),
        Content: log.content,
        'Sender ID': log.sender_id || 'Rachael-RTK',
        'Sent At': new Date(log.sent_at).toLocaleString('en-GB')
      }))
      const wsLogs = XLSX.utils.json_to_sheet(logsData)
      XLSX.utils.book_append_sheet(wb, wsLogs, 'Detailed Message Logs')

      // 4. Trigger download
      XLSX.writeFile(wb, `concord_sms_report_${new Date().toISOString().substring(0, 10)}.xlsx`)
      toast.success('Successfully exported report to Excel!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate Excel report.')
    }
  }

  const handlePrintPDF = () => {
    window.print()
  }

  return (
    <>
      {/* Dynamic print-only stylesheet injected at runtime */}
      <style jsx global>{`
        @media print {
          /* Hide non-essential layout controls */
          aside, 
          header, 
          nav, 
          input, 
          select, 
          button, 
          .no-print,
          .bg-slate-50\/50,
          .px-6.py-4.border-b {
            display: none !important;
          }
          
          /* Full width layout reset */
          body, 
          main, 
          .main-content {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }

          /* Force full grid and cards to remain visible */
          .grid {
            display: grid !important;
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }

          /* Prevent table rows breaking mid page */
          tr {
            page-break-inside: avoid !important;
          }

          .shadow-sm, .shadow-md {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Export Campaign Reports</h3>
          <p className="text-[10px] text-slate-400 font-medium">Export the active filtered list and performance metrics below.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 text-blue-700 text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {/* Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 text-emerald-700 text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Table className="w-3.5 h-3.5" />
            Export Excel (XLSX)
          </button>

          {/* PDF via browser Print */}
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            Print to PDF
          </button>
        </div>
      </div>
    </>
  )
}
