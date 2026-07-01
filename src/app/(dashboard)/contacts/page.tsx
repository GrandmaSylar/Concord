import { getContacts, getContactFilterOptions } from './actions'
import ContactList from './ContactList'
import AddContactForm from './AddContactForm'
import ImportContacts from './ImportContacts'
import { getConstituencyGroups } from '../constituency/actions'

export default async function ContactsPage() {
 // Fetch contacts and constituency groups on the server
 const [contacts, groups, filterOptions] = await Promise.all([
 getContacts(),
 getConstituencyGroups(),
 getContactFilterOptions()
 ])

 return (
 <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Contacts</h1>
 <p className="text-sm text-gray-500 mt-1">Manage your contacts and contact groups.</p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Column: List & Filter */}
 <div className="lg:col-span-2 flex flex-col gap-4">
 <ContactList initialContacts={contacts} filterOptions={filterOptions} />
 </div>

 {/* Right Column: Add Contact Form & Import */}
 <div className="flex flex-col gap-6">
 <AddContactForm groups={groups} />
 <ImportContacts />
 </div>
 </div>
 </div>
 )
}
