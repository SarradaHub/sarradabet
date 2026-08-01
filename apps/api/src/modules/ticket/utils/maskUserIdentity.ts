export function maskUserIdentity(email: string, username: string): string {
  if (email.includes("@")) {
    const [local, domain] = email.split("@");
    if (!local || !domain) {
      return maskUsername(username);
    }
    const maskedLocal =
      local.length <= 1 ? `${local}***` : `${local[0]}***`;
    return `${maskedLocal}@${domain}`;
  }

  return maskUsername(username);
}

function maskUsername(username: string): string {
  if (username.length <= 2) {
    return `${username[0] ?? "*"}***`;
  }

  return `${username[0]}***${username.at(-1)}`;
}
