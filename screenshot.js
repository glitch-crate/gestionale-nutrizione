const puppeteer = require("puppeteer-core");

const CHROME_PATH = "/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 900, isMobile: true, hasTouch: true });

  for (const { url, file } of [
    { url: "http://localhost:3000/portale/registrati", file: "registrati.png" },
    { url: "http://localhost:3000/portale/login", file: "login.png" },
    { url: "http://localhost:3000/privacy", file: "privacy.png" },
  ]) {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
    await page.screenshot({ path: `/home/claude/screenshots/${file}`, fullPage: true });
    console.log("catturato:", file);
  }

  // Login con l'account di test e screenshot delle pagine protette
  await page.goto("http://localhost:3000/portale/login", { waitUntil: "networkidle0" });
  await page.type('input[type="email"]', "test-screenshot@example.com");
  await page.type('input[type="password"]', "Screenshot123!");
  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 3000));
  console.log("URL dopo il click:", page.url());
  await page.screenshot({ path: "/home/claude/screenshots/debug-after-login.png", fullPage: true });
  await page.screenshot({ path: "/home/claude/screenshots/prenota.png", fullPage: true });
  console.log("catturato: prenota.png");

  await page.goto("http://localhost:3000/portale/i-miei-appuntamenti", { waitUntil: "networkidle0" });
  await page.screenshot({ path: "/home/claude/screenshots/i-miei-appuntamenti.png", fullPage: true });
  console.log("catturato: i-miei-appuntamenti.png");

  await browser.close();
})();
