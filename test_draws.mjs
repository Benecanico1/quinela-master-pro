import { getClientDraws, getLocalDateString, REAL_OFFICIAL_DRAWS_DATABASE } from "./frontend/src/services/clientEngine.js";

console.log("Local date now:", getLocalDateString());

console.log("\n=== TEST getClientDraws for 2026-08-28 (Today) ===");
const resToday = getClientDraws("all", "all", 20, "2026-08-28");
console.log("Total draws returned:", resToday.draws.length);
resToday.draws.forEach(d => console.log(`${d.draw_date} | ${d.lottery.padEnd(9)} | ${d.shift.padEnd(10)} | 1°: ${d.p1} | Status: ${d.status} (${d.status_text})`));

console.log("\n=== TEST getClientDraws for 2026-08-27 (Yesterday) ===");
const resYesterday = getClientDraws("all", "all", 20, "2026-08-27");
console.log("Total draws returned:", resYesterday.draws.length);
resYesterday.draws.forEach(d => console.log(`${d.draw_date} | ${d.lottery.padEnd(9)} | ${d.shift.padEnd(10)} | 1°: ${d.p1} | Status: ${d.status} (${d.status_text})`));
