import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Khởi chạy Puppeteer E2E Test đơn giản...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    console.log('🌐 Đang tải trang https://hexastrategy.onrender.com ...');
    await page.goto('https://hexastrategy.onrender.com', { waitUntil: 'networkidle2' });
    console.log('✅ Đã tải xong trang web!');

    await page.screenshot({ path: 'scratch/p1_home.png' });
    console.log('📸 Đã lưu hình ảnh trang chủ tại scratch/p1_home.png');
  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    await browser.close();
  }
})();
