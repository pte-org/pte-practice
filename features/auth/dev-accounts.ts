export interface DevTestAccount {
  username: string;
  password: string;
}

/** Parses `account:password;account2:password2`; the password may itself contain `:`. */
export function parseDevTestAccounts(raw: string): DevTestAccount[] {
  return raw.split(";").flatMap((entry) => {
    const separator = entry.indexOf(":");
    if (separator <= 0) return [];
    const username = entry.slice(0, separator).trim();
    const password = entry.slice(separator + 1).trim();
    return username && password ? [{ username, password }] : [];
  });
}
