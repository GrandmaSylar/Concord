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
    const to = normalizedRecipients.join(",");
    const sender = "Concord";
    const encodedMessage = encodeURIComponent(message);

    const url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${apiKey}&to=${to}&from=${sender}&sms=${encodedMessage}&response=json`;

    const response = await fetch(url, { method: "GET" });
    const data = await response.json();

    if (!response.ok) {
      console.error("Arkesel HTTP Error:", response.status, data);
      return { error: `Arkesel error: ${data?.message || response.status}` };
    }

    if (
      data.code === "100" ||
      data.code === 100 ||
      data.code === "ok" ||
      data.message?.toLowerCase().includes("success")
    ) {
      return { success: true, status: "success", data };
    } else {
      return { error: data.message || "Failed to send SMS via Arkesel" };
    }
  } catch (error) {
    console.error("Arkesel SMS send error:", error);
    return { error: "Network error while contacting SMS Gateway" };
  }
}
