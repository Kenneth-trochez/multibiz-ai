type SendPushParams = {
  businessId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
};

export async function sendPushToBusinessMembers({
  businessId,
  title,
  body,
  data = {},
}: SendPushParams) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/mobile_push_tokens?business_id=eq.${businessId}&is_active=eq.true&select=expo_push_token,role`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`No se pudieron obtener los tokens push: ${text}`);
  }

  const rows = await response.json();

  const messages = rows.map((row: any) => ({
    to: row.expo_push_token,
    sound: "default",
    title,
    body,
    data,
  }));

  if (!messages.length) {
    return { sent: 0 };
  }

  const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!expoResponse.ok) {
    const text = await expoResponse.text();
    throw new Error(`No se pudo enviar la notificación push: ${text}`);
  }

  const expoJson = await expoResponse.json();

  return {
    sent: messages.length,
    expo: expoJson,
  };
}