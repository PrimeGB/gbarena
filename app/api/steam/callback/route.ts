const claimedIdPattern = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

async function getPersonaName(steamId: string) {
  try {
    const res = await fetch(`https://steamcommunity.com/profiles/${steamId}?xml=1`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return "";
    const xml = await res.text();
    const match = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/);
    return (match?.[1] || "").replace(/[()]/g, "").trim().slice(0, 40);
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = (reason: string) =>
    Response.redirect(`${url.origin}/profile/edit?platform=pc&steam_error=${reason}`, 302);

  if (url.searchParams.get("openid.return_to") !== `${url.origin}/api/steam/callback`) {
    return fail("invalid");
  }

  const claimed = url.searchParams.get("openid.claimed_id") || "";
  const steamId = claimed.match(claimedIdPattern)?.[1];
  if (!steamId) return fail("invalid");

  // Ask Steam to confirm it issued this sign-in so the ID cannot be forged.
  const verification = new URLSearchParams(url.searchParams);
  verification.set("openid.mode", "check_authentication");

  try {
    const res = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verification,
      signal: AbortSignal.timeout(6000),
    });
    const text = await res.text();
    if (!res.ok || !/is_valid\s*:\s*true/.test(text)) return fail("invalid");
  } catch {
    return fail("unavailable");
  }

  const name = await getPersonaName(steamId);
  const accountId = name ? `${name} (${steamId})` : steamId;

  return Response.redirect(
    `${url.origin}/profile/edit?platform=pc&focus=gaming-account&steam_id=${encodeURIComponent(accountId)}`,
    302,
  );
}
