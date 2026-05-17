export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "233" + digits.substring(1);
  }
  return digits;
}

export async function sendSMS(recipients: string[], message: string) {
  const apiKey = Deno.env.get("ARKESEL_API_KEY");

  if (!apiKey) {
    console.error("ARKESEL_API_KEY is missing.");
    return { error: "Server configuration error" };
  }

  try {
    const normalizedRecipients = recipients.map(normalizePhone);
    
    // Using Arkesel v2 API which supports dynamic callbacks
    const url = "https://sms.arkesel.com/api/v2/sms/send";
    
    const payload = {
      sender: "Concord",
      message: message,
      recipients: normalizedRecipients,
      // Dynamically tell Arkesel exactly where to send the delivery report!
      callback_url: "https://vjcvmfnobjgsdsmkqijv.supabase.co/functions/v1/arkesel-webhook"
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Arkesel HTTP Error:", response.status, data);
      return { error: `Arkesel error: ${data?.message || response.status}` };
    }

    // Arkesel v2 success payload contains data
    if (data.status === "success" || data.message?.toLowerCase().includes("success")) {
      return { success: true, status: "success", data };
    } else {
      return { error: data.message || "Failed to send SMS via Arkesel" };
    }
  } catch (error) {
    console.error("Arkesel SMS send error:", error);
    return { error: "Network error while contacting SMS Gateway" };
  }
}
