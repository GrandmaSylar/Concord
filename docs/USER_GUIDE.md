# Concord Bulk SMS System — User Manual

Welcome to the **Concord Bulk SMS Portal User Manual**. This guide is written in plain language to help you manage your contacts, create message campaigns, and track sent messages easily.

---

## 1. Logging In and Security

### 1.1 Logging In
1. Open the platform link in your web browser.
2. Enter your registered email address and password.
3. Click **Access Dashboard**.

### 1.2 Account Lockout (If you forget your password)
- If you enter the wrong password 5 times in a row, the system will lock your account to protect your information from unauthorized access.
- The first lock lasts **30 seconds**. If you keep entering the wrong password, the lock time will double each time (1 minute, 2 minutes, 4 minutes, etc.). 
- Once the timer runs out, you can try logging in again.

### 1.3 Setting a Strong Password (First-Time Login)
All new users must set a secure password upon logging in for the first time. Your new password must meet these security checks:
- Must be at least **8 characters** long.
- Must contain at least **one uppercase letter** (A-Z).
- Must contain at least **one lowercase letter** (a-z).
- Must contain at least **one number** (0-9).
- Must contain at least **one special symbol** (such as `@, $, !, %, *, ?, &`).

*The system will show green checkmarks as you type to let you know when each rule is met.*

---

## 2. The Dashboard (Overview)

The **Dashboard** is the first page you see. It shows your system's status:
- **Total Constituents:** The total number of contacts saved in your database.
- **Gateway Deliverability:** The total number of messages successfully delivered to network providers.
- **Outgoing Campaigns:** A combined count of all messages sent, failed, or currently waiting to go out.
- **Pending Reminders:** Scheduled messages waiting for their dispatch time.
- **Message Queue Monitor:** A real-time tracker showing messages currently being processed. It updates automatically every 3 seconds to show you:
  - **Pending:** Messages waiting in line to be sent.
  - **Processing:** Messages currently being dispatched.
  - **Delivered:** Messages successfully sent to the network.
  - **Failed:** Messages that could not go through (e.g. incorrect phone numbers).
  - **Throughput:** How fast messages are sending (messages sent per 3 seconds).

---

## 3. Managing Your Contacts

Click the **Contacts** tab to view and manage your contact list:

### 3.1 Adding a Single Contact
1. Click **Add Contact**.
2. Enter their name, phone number, and optional details (like their job position, neighborhood/sub-area, or polling station).
3. Select a group if you want to categorize them.
4. Click **Save Contact**.

### 3.2 Importing Contacts in Bulk (Excel / CSV)
Instead of adding contacts one by one, you can upload a spreadsheet:
1. Prepare an Excel or CSV file.
2. Ensure your sheet has columns for **Name**, **Phone**, and optional columns like **Group**, **Position**, **Sub-Area**, and **Polling Station**.
3. In the Contacts tab, click the **Import Contacts** area and choose your file.
4. The system will read the column headers and add the contacts automatically.

### 3.3 Opting Out Contacts
- If a contact asks not to receive messages, find their name in the contact list and click the **Power toggle** next to their name.
- When turned off, their name will appear crossed out, and the system will block any future messages from being sent to their number. You can toggle this back on at any time.

---

## 4. Constituency Filters (Targeting Specific Voters)

The **Constituency** tab is built to help you find and select specific groups of people in your area:
- **By Sub-Area:** Click any neighborhood or sub-area button to see only the contacts living in that location.
- **By Position:** Filter to see only specific leaders (for example, show only "Chairmen").
- **By Station:** Select a specific Polling Station from the dropdown list to see registered voters at that location.
- **Smart Filters:** Instantly find database issues (e.g. show contacts missing phone numbers or missing Voter IDs).
- **Sending to Selected Contacts:** 
  1. Use the filters to find your target group.
  2. Tick individual boxes, or click **Select All Matching** to select everyone in that filtered list.
  3. Click the green **Send SMS to Selected** button in the footer bar. This will load them into the Send SMS form automatically.

---

## 5. Sending Messages (Send SMS)

Use the **Send SMS** tab to compose and write messages:

### 5.1 Choosing Recipients
- If you loaded contacts from the **Constituency** tab, they will show as pre-selected.
- You can search and select more contacts using the checkbox table.
- **Temporary Numbers:** If you have extra phone numbers that aren't saved in your database, paste them into the "Temporary Numbers" box separated by commas. The system will send messages to them without saving them.

### 5.2 Personalizing Your Messages (Placeholders)
You can make each message feel personal by using placeholders. Click the buttons below the text box to insert them:
- `[Firstname]` — Replaced by the contact's first name.
- `[Lastname]` — Replaced by the contact's last name.
- `[Fullname]` — Replaced by the contact's full name.
- `[Position]` — Replaced by the contact's position (e.g., Coordinator).
- `[SubArea]` — Replaced by the contact's neighborhood.

*Example: "Hello [Firstname], please join us at the meeting tomorrow." will automatically send as "Hello Rachael, please join us..." for Rachael, and "Hello Ameyaw, please join us..." for Ameyaw.*

### 5.3 Sender IDs
Choose who the message appears from. Select one of the buttons:
- **Rachael-RTK:** Official primary campaign channel.
- **RachaelWG:** Alternate campaign route.
- **RTK4SERVICE:** General alerts or notifications.

### 5.4 Live Phone Mockup Preview
As you type, look at the phone screen mockup on the right. It displays a live preview showing exactly how the text message will look on a mobile phone, including how the placeholders will evaluate for a sample recipient.

---

## 6. Message Templates

Save time by using **Templates**:
- Create templates in the **Templates** tab by giving them a name and message content.
- Use these special words in your template names to group them:
  - `[Mobilization]` for event invites or rally details.
  - `[Outreach]` for information updates.
  - `[Voter Care]` for birthdays, holidays, or thank-you messages.
  - `[Training]` for internal briefing notes.
- When writing a message in the **Send SMS** page, select a template from the dropdown to fill in the text box instantly.

---

## 7. Scheduling Messages (Reminders)

If you want to write a message now but send it later:
1. Open the **Reminders** tab.
2. Select the group of contacts you want to reach.
3. Choose the exact date and time you want the message to go out.
4. Type your message (you can still use personalization tags).
5. Click **Schedule Reminder**. The system will store the message and send it automatically at the selected time.

---

## 8. Reports

The **Reports** tab keeps a record of all transactions:
- **Audit Trails:** See a list of sent messages, who they went to, and when they were sent.
- **Search Filters:** Search past logs by typing a phone number or part of the message text.
- **Delivery Status:** Check if messages succeeded or failed to deliver.

---

## 9. Version Control (System History)

This section documents the platform versions and updates:

### Version 1.0.0 (Current Version)
- Official production launch.
- Persistent light theme implemented across all menus and layouts.
- Added database optimization indexes to speed up contact searches and message logs.
- Added a floating AI Assistant box that stays in the bottom right corner of the page during scroll.
- Mandated secure password resets for all accounts.
- Pre-configured Arkesel API connection for instant SMS deliveries.
