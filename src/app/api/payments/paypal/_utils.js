const getPaypalBaseUrl = () =>
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export const getPaypalAccessToken = async () => {
  const clientId =
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing required environment variables: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET",
    );
  }

  if (clientId === clientSecret) {
    throw new Error(
      "PAYPAL_CLIENT_SECRET looks invalid. Use the sandbox app secret from PayPal Developer Dashboard, not the client ID.",
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || "Unable to get PayPal access token");
  }

  return {
    accessToken: data.access_token,
    baseUrl: getPaypalBaseUrl(),
  };
};
