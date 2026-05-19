import { getConstituencyContacts, getConstituencyGroups, getConstituencyStats } from './actions'
import ConstituencySelector from './ConstituencySelector'

export default async function ConstituencyPage() {
  const [initialData, groups, stats] = await Promise.all([
    getConstituencyContacts({ page: 1, pageSize: 50 }),
    getConstituencyGroups(),
    getConstituencyStats(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Constituency Contacts
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Drybone electoral area members — filter, select, and send targeted SMS campaigns.
        </p>
      </div>

      <ConstituencySelector
        initialContacts={initialData.contacts}
        initialTotal={initialData.total}
        groups={groups}
        initialStats={stats}
      />
    </div>
  )
}
