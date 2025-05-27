// // lib/auth.ts
// export const API = process.env.NEXT_PUBLIC_API_BASE_URL!;
//
// /** Kick off Google login on the back-end, then back to `redirect` after success */
// export function login(redirect = "/") {
//     window.location.href =
//         `${API}/oauth2/authorization/google?redirect=` +
//         encodeURIComponent(redirect);
// }
//
// /** GET /api/auth/me – includes cookies, so we need credentials: 'include' */
// export async function fetchSession() {
//     const res = await fetch(`${API}/api/auth/me`, {
//         credentials: "include",
//     });
//     return (await res.json()) as
//         | { authenticated: string }
//         | { authenticated: string; name: string; picture: string };
// }