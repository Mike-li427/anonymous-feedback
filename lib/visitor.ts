// Generate or retrieve visitor token from localStorage
export function getVisitorToken(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  let token = localStorage.getItem("visitor_token");
  if (!token) {
    token = generateToken();
    localStorage.setItem("visitor_token", token);
  }
  return token;
}

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
