'use server'

export async function getSmsBalance() {
  const apiKey = process.env.ARKESEL_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://sms.arkesel.com/sms/api?action=check-balance&api_key=${apiKey}&response=json`
    const response = await fetch(url, { next: { revalidate: 60 } }) // Cache for 60 seconds
    const data = await response.json()
    return data?.balance || 0
  } catch (error) {
    console.error('Arkesel Balance check error:', error)
    return null
  }
}
