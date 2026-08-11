import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Khởi chạy E2E Test nghiệm thu Story 005...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context1 = await browser.createBrowserContext();
    const page1 = await context1.newPage();
    page1.on('dialog', async d => await d.dismiss());
    await page1.goto('https://hexastrategy.onrender.com', { waitUntil: 'networkidle2' });
    await page1.click('#btn-auth-open');
    await page1.type('#auth-username', 'maicv');
    await page1.type('#auth-pass', 'hunter123');
    await page1.click('#btn-auth-submit');
    await new Promise(r => setTimeout(r, 2000));

    const context2 = await browser.createBrowserContext();
    const page2 = await context2.newPage();
    page2.on('dialog', async d => await d.dismiss());
    await page2.goto('https://hexastrategy.onrender.com', { waitUntil: 'networkidle2' });
    await page2.click('#btn-auth-open');
    await page2.type('#auth-username', 'maicv1');
    await page2.type('#auth-pass', 'hunter123');
    await page2.click('#btn-auth-submit');
    await new Promise(r => setTimeout(r, 2000));

    await page1.click('#btn-lobby-open');
    await page2.click('#btn-lobby-open');
    await new Promise(r => setTimeout(r, 2000));

    await page1.evaluate(() => {
      const btns = document.querySelectorAll('.btn-challenge');
      if (btns.length > 0) btns[0].click();
    });
    await new Promise(r => setTimeout(r, 2000));

    await page2.evaluate(() => {
      const btn = document.getElementById('btn-challenge-accept');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    await page1.click('#btn-start-battle');
    await page2.click('#btn-start-battle');
    await new Promise(r => setTimeout(r, 4000));

    await page1.screenshot({ path: 'scratch/story005_p1.png' });
    await page2.screenshot({ path: 'scratch/story005_p2.png' });
    console.log('📸 Đã chụp ảnh nghiệm thu Story 005 thành công!');
  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    await browser.close();
  }
})();
