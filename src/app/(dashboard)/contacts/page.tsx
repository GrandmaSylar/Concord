import { getContacts } from './actions'
import ContactList from './ContactList'
import AddContactForm from './AddContactForm'
import ImportContacts from './ImportContacts'

export default async function ContactsPage() {
  // Fetch contacts on the server
  const contacts = await getContacts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your contacts and contact groups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List & Filter */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ContactList initialContacts={contacts} />
        </div>

        {/* Right Column: Add Contact Form & Import */}
        <div className="flex flex-col gap-6">
          <AddContactForm />
          <ImportContacts />
        </div>
      </div>
    </div>
  )
}
