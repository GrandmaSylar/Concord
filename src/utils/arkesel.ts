// Normalize a phone number to international format (Ghana: 233...)
function normalizePhone(phone: string): string {
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '')
  
  // Convert local Ghana format (0XX...) to international (233XX...)
  if (digits.startsWith('0') && digits.length === 10) {
    digits = '233' + digits.substring(1)
  }
  
  // If already has country code (233...) leave it
  // If someone typed +233..., the + was already stripped above
  return digits
}

export async function sendSMS(recipients: string[], message: string, sender?: string) {
  const apiKey = process.env.ARKESEL_API_KEY

  if (!apiKey) {
    console.error('ARKESEL_API_KEY is missing.')
    return { error: 'Server configuration error' }
  }

  try {
    // Normalize all phone numbers to international format
    const normalizedRecipients = recipients.map(normalizePhone)
    const to = normalizedRecipients.join(',')
    const senderId = sender || 'Concord'
    const encodedMessage = encodeURIComponent(message)
    
    // Using the Arkesel v1 API
    const url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${apiKey}&to=${to}&from=${senderId}&sms=${encodedMessage}&response=json`

    console.log('Arkesel request URL (redacted key):', url.replace(apiKey, '***'))

    const response = await fetch(url, {
      method: 'GET',
    })

    const data = await response.json()
    console.log('Arkesel API Response:', JSON.stringify(data))

    if (!response.ok) {
      console.error('Arkesel HTTP Error:', response.status, data)
      return { error: `Arkesel error: ${data?.message || response.status}` }
    }

    if (data.code === '100' || data.code === 100 || data.code === 'ok' || data.message?.toLowerCase().includes('success')) {
      return { success: true, status: 'success', data }
    } else {
      return { error: data.message || 'Failed to send SMS via Arkesel' }
    }

  } catch (error) {
    console.error('Arkesel SMS send error:', error)
    return { error: 'Network error while contacting SMS Gateway' }
  }
}

export async function checkBalance() {
  const apiKey = process.env.ARKESEL_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://sms.arkesel.com/sms/api?action=check-balance&api_key=${apiKey}&response=json`
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Arkesel Balance check error:', error)
    return null
  }
}
