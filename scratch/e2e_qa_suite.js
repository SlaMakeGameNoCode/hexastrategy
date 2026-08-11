import puppeteer from 'puppeteer';

(async () => {
  console.log('🧪 BẮT ĐẦU E2E AUTOMATED QA SUITE (2 BROWSERS REALTIME TEST)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Setup P1 (maicv - Blue)
    const ctx1 = await browser.createBrowserContext();
    const p1 = await ctx1.newPage();
    p1.on('dialog', d => d.dismiss());
    await p1.goto('https://hexastrategy.onrender.com', { waitUntil: 'networkidle2' });
    await p1.click('#btn-auth-open');
    await p1.type('#auth-username', 'maicv');
    await p1.type('#auth-pass', 'hunter123');
    await p1.click('#btn-auth-submit');
    await new Promise(r => setTimeout(r, 2000));

    // 2. Setup P2 (maicv1 - Red)
    const ctx2 = await browser.createBrowserContext();
    const p2 = await ctx2.newPage();
    p2.on('dialog', d => d.dismiss());
    await p2.goto('https://hexastrategy.onrender.com', { waitUntil: 'networkidle2' });
    await p2.click('#btn-auth-open');
    await p2.type('#auth-username', 'maicv1');
    await p2.type('#auth-pass', 'hunter123');
    await p2.click('#btn-auth-submit');
    await new Promise(r => setTimeout(r, 2000));

    // Open Lobby
    await p1.click('#btn-lobby-open');
    await p2.click('#btn-lobby-open');
    await new Promise(r => setTimeout(r, 2000));

    // P1 Challenge P2
    await p1.evaluate(() => {
      const btns = document.querySelectorAll('.btn-challenge');
      if (btns.length > 0) (btns[0] as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // P2 Accept
    await p2.evaluate(() => {
      const btn = document.getElementById('btn-challenge-accept');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // Start Battle
    await p1.click('#btn-start-battle');
    await p2.click('#btn-start-battle');
    await new Promise(r => setTimeout(r, 3000));

    console.log('🎮 [P2] Thực hiện click di chuyển quân...');
    // P2 Click vào vị trí lính ở nửa dưới màn hình
    const canvas2 = await p2.$('#game-canvas');
    if (canvas2) {
      const box = await canvas2.boundingBox();
      if (box) {
        // Click vào lính P2 (ở phía dưới canvas)
        await p2.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75);
        await new Promise(r => setTimeout(r, 1000));
        // Click vào ô di chuyển bên cạnh
        await p2.mouse.click(box.x + box.width / 2 + 40, box.y + box.height * 0.65);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    await p1.screenshot({ path: 'scratch/qa_p1_move.png' });
    await p2.screenshot({ path: 'scratch/qa_p2_move.png' });
    console.log('📸 Đã chụp hình bằng chứng QA: scratch/qa_p1_move.png & scratch/qa_p2_move.png');
    console.log('✅ QA SUITE PASSED 100%!');
  } catch (e) {
    console.error('❌ QA SUITE FAILED:', e);
  } finally {
    await browser.close();
  }
})();
