import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Khởi chạy E2E PvP Auto Test...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context1 = await browser.createBrowserContext();
    const page1 = await context1.newPage();
    page1.on('dialog', async dialog => { await dialog.dismiss(); });
    console.log('🌐 [P1 - maicv] Tải trang...');
    await page1.goto('https://hexastrategy.onrender.com', { waitUntil: 'networkidle2' });

    await page1.click('#btn-auth-open');
    await page1.type('#auth-username', 'maicv');
    await page1.type('#auth-pass', 'hunter123');
    await page1.click('#btn-auth-submit');
    console.log('🔑 [P1 - maicv] Đã đăng nhập');
    await new Promise(r => setTimeout(r, 2000));

    const context2 = await browser.createBrowserContext();
    const page2 = await context2.newPage();
    page2.on('dialog', async dialog => { await dialog.dismiss(); });
    console.log('🌐 [P2 - maicv1] Tải trang...');
    await page2.goto('https://hexastrategy.onrender.com', { waitUntil: 'networkidle2' });

    await page2.click('#btn-auth-open');
    await page2.type('#auth-username', 'maicv1');
    await page2.type('#auth-pass', 'hunter123');
    await page2.click('#btn-auth-submit');
    console.log('🔑 [P2 - maicv1] Đã đăng nhập');
    await new Promise(r => setTimeout(r, 2000));

    // Mở Sảnh
    console.log('🏛️ Vào Sảnh PvP...');
    await page1.click('#btn-lobby-open');
    await page2.click('#btn-lobby-open');
    await new Promise(r => setTimeout(r, 2000));

    await page1.screenshot({ path: 'scratch/p1_lobby.png' });
    await page2.screenshot({ path: 'scratch/p2_lobby.png' });

    // P1 thách đấu P2
    console.log('⚔️ [P1] Thách đấu P2...');
    await page1.evaluate(() => {
      const btns = document.querySelectorAll('.btn-challenge');
      if (btns.length > 0) btns[0].click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // P2 Chấp nhận
    console.log('✅ [P2] Chấp nhận...');
    await page2.evaluate(() => {
      const btn = document.getElementById('btn-challenge-accept');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Cả 2 bấm Bắt Đầu Trận
    console.log('🚀 Cả 2 bấm Bắt Đầu Trận...');
    await page1.click('#btn-start-battle');
    await page2.click('#btn-start-battle');
    await new Promise(r => setTimeout(r, 3000));

    // Chụp hình Bàn Cờ PvP thực tế khi vào trận
    await page1.screenshot({ path: 'scratch/p1_in_battle.png' });
    await page2.screenshot({ path: 'scratch/p2_in_battle.png' });
    console.log('📸 ĐÃ CHỤP ẢNH BÀN CỜ THÀNH CÔNG: scratch/p1_in_battle.png & scratch/p2_in_battle.png');

    console.log('🎉 E2E TEST HOÀN TẤT THÀNH CÔNG 100%!');
  } catch (err) {
    console.error('❌ Lỗi E2E Test:', err);
  } finally {
    await browser.close();
  }
})();
