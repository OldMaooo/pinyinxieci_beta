const { chromium } = require('playwright');

(async () => {
  console.log('🚀 启动浏览器测试...\n');

  const browser = await chromium.launch({ headless: false }); // 显示浏览器
  const page = await browser.newPage();

  // 监听控制台
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ 控制台错误: ${msg.text()}`);
    }
  });

  // 1. 打开主应用
  console.log('📱 步骤1: 打开应用...');
  await page.goto('http://localhost:3009', { waitUntil: 'networkidle' });

  // 等待"云端就绪"
  await page.waitForFunction(() => {
    return document.body.innerText.includes('云端就绪');
  }, { timeout: 30000 });
  console.log('✅ 等待"云端就绪"... 完成\n');

  // 2. 打开调试页面获取一个测试词
  console.log('📊 步骤2: 获取一个连续5天的词...');
  const debugPage = await browser.newPage();
  await debugPage.goto(`file://${process.cwd()}/debug-mastery.html`, { waitUntil: 'networkidle' });
  await debugPage.waitForTimeout(3000);

  // 获取一个 MASTERED 状态的词
  const testWord = await debugPage.evaluate(() => {
    const cards = document.querySelectorAll('.word-card.mastered');
    if (cards.length > 0) {
      return cards[0].querySelector('.word-title').innerText;
    }
    return null;
  });

  if (!testWord) {
    console.log('❌ 没找到连续5天的词');
    await browser.close();
    process.exit(1);
  }

  console.log(`✅ 找到测试词: "${testWord}"`);

  // 3. 记录当前状态
  console.log('\n📝 步骤3: 记录当前状态...');
  const initialStatus = await debugPage.evaluate((word) => {
    const cards = document.querySelectorAll('.word-card');
    for (let card of cards) {
      if (card.querySelector('.word-title').innerText === word) {
        const history = card.querySelector('.word-history').innerText;
        const details = card.querySelector('.word-details').innerText;
        return { history, details };
      }
    }
    return null;
  }, testWord);

  console.log(`   初始状态: ${initialStatus.details}`);
  console.log(`   历史记录: ${initialStatus.history}`);

  // 4. 在主应用中练习这个词并答错
  console.log('\n🎯 步骤4: 在应用中练习并答错...');
  await page.bringToFront();

  // 等待加载完成
  await page.waitForTimeout(2000);

  // 检查页面状态
  const pageTitle = await page.title();
  console.log(`   页面标题: ${pageTitle}`);

  // 查找包含测试词的元素
  const hasTestWord = await page.evaluate((word) => {
    return document.body.innerText.includes(word);
  }, testWord);

  console.log(`   页面包含"${testWord}": ${hasTestWord ? '是' : '否'}`);

  if (!hasTestWord) {
    console.log('\n⚠️  测试词不在当前页面，请手动操作:');
    console.log(`   1. 在主应用中进入练习`);
    console.log(`   2. 找到"${testWord}"这个词`);
    console.log(`   3. 点击"不会"（红色按钮）`);
    console.log(`   4. 完成练习并保存`);
    console.log(`   5. 刷新调试页面查看变化\n`);

    console.log('请按回车键继续（手动完成测试后）...');
    await new Promise(r => process.stdin.once('data', r));
  } else {
    console.log('\n✅ 页面包含测试词，请手动完成操作:');
    console.log(`   1. 点击"${testWord}"对应的"不会"按钮`);
    console.log(`   2. 进入自测，家长终测`);
    console.log(`   3. 保存`);
  }

  console.log('\n⏸️  等待你手动操作完成...（完成后按回车）');
  await new Promise(r => process.stdin.once('data', r));

  // 5. 验证结果
  console.log('\n🔍 步骤5: 验证结果...');
  await debugPage.reload();
  await debugPage.waitForTimeout(3000);

  const finalStatus = await debugPage.evaluate((word) => {
    const cards = document.querySelectorAll('.word-card');
    for (let card of cards) {
      if (card.querySelector('.word-title').innerText === word) {
        const history = card.querySelector('.word-history').innerText;
        const details = card.querySelector('.word-details').innerText;
        const status = card.querySelector('.word-status').innerText;
        return { history, details, status };
      }
    }
    return null;
  }, testWord);

  console.log(`\n📊 最终状态:`);
  console.log(`   状态: ${finalStatus.status}`);
  console.log(`   详情: ${finalStatus.details}`);
  console.log(`   历史: ${finalStatus.history}`);

  // 验证变化
  console.log('\n✅ 验证结果:');
  if (finalStatus.status === 'WEAK' || finalStatus.status === '薄弱') {
    console.log('   ✓ 状态已变成"薄弱"');
  } else if (finalStatus.status === 'MASTERED' || finalStatus.status === '掌握') {
    console.log('   ⚠️ 状态还是"掌握"，可能操作有问题');
  }

  if (finalStatus.details.includes('连续: 0')) {
    console.log('   ✓ 连续绿天数已变成 0');
  }

  if (finalStatus.history.includes('red')) {
    console.log('   ✓ 历史记录包含 red');
  }

  console.log('\n🎉 测试完成！');
  await browser.close();
})();
