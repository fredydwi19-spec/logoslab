import { BankSoalFtbUI } from "./src/views/components/BankSoalFtb";
const html = BankSoalFtbUI();
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  require("fs").writeFileSync("test_ftb_script.js", scriptMatch[1]);
  console.log("Extracted FTB script");
} else {
  console.log("No script tag found");
}
