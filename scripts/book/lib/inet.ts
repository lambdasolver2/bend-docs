// The interaction-net engine, loaded once for the build. `assets/inet.js` is the classic
// script the page loads as well, so static figures, players and the archive's box diagrams
// all come from one implementation.
import fs from "node:fs";
import path from "node:path";

export const INET_JS = path.join(import.meta.dir, "../assets/inet.js");

export const Inet: any = new Function(fs.readFileSync(INET_JS, "utf8") + "\nreturn Inet;")();
