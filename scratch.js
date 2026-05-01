const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  const hero = await page.$('.pp-hero');
  const visual = await page.$('.pp-hero-visual');
  const b1 = await hero.boundingBox();
  const b2 = await visual.boundingBox();
  console.log('Hero:', b1);
  console.log('Visual:', b2);
  await browser.close();
})();
