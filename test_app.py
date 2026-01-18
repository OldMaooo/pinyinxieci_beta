#!/usr/bin/env python3
"""
Test the pinyin dictation app - verify UI and audio functionality.
"""

from playwright.sync_api import sync_playwright
import time


def test_dictation_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navigate to app
        print("📍 访问应用...")
        page.goto("http://localhost:5175")
        page.wait_for_load_state("networkidle")
        print("✅ 页面加载完成")

        # Take initial screenshot
        page.screenshot(path="/tmp/app-initial.png", full_page=True)
        print("✅ 初始截图保存到 /tmp/app-initial.png")

        # Check if we're on setup page
        print("\n🔍 检查页面元素...")
        page.wait_for_timeout(2000)

        # Look for unit selection or start button
        buttons = page.locator("button").all()
        print(f"📊 找到 {len(buttons)} 个按钮")

        for i, btn in enumerate(buttons):
            text = btn.inner_text()
            print(f"  按钮 {i + 1}: {text[:50]}")

        # Try to find and click start button
        start_btn = page.locator('text="开始练习"')
        if start_btn.count() > 0:
            print("\n▶️ 点击 '开始练习' 按钮...")
            start_btn.first.click()
            page.wait_for_load_state("networkidle")
            print("✅ 进入练习页面")

            # Screenshot practice page
            page.screenshot(path="/tmp/app-practice.png", full_page=True)
            print("✅ 练习页面截图保存到 /tmp/app-practice.png")

            # Look for dictation button
            print("\n🔍 查找听写按钮...")
            dictation_btn = page.locator('text="开启听写"')
            if dictation_btn.count() > 0:
                print("✅ 找到 '开启听写' 按钮")
                print("   状态:", dictation_btn.first.is_enabled())

                # Click dictation button
                print("\n▶️ 点击 '开启听写'...")
                dictation_btn.first.click()
                page.wait_for_timeout(2000)
                print("✅ 听写已启动")

                # Screenshot with dictation active
                page.screenshot(path="/tmp/app-dictation.png", full_page=True)
                print("✅ 听写页面截图保存到 /tmp/app-dictation.png")

                # Check if audio controls are visible
                print("\n🔍 检查音频控制...")
                audio_controls = page.locator("button").filter(has_text="测试当前声音")
                if audio_controls.count() > 0:
                    print("✅ 找到 '测试当前声音' 按钮")

                    # Click test sound button
                    print("\n▶️ 点击 '测试当前声音'...")
                    audio_controls.first.click()
                    print("✅ 已点击测试按钮")

                    # Wait for audio
                    page.wait_for_timeout(3000)

                    # Check console logs
                    console_messages = []
                    page.on(
                        "console",
                        lambda msg: console_messages.append(f"{msg.type}: {msg.text}"),
                    )

                    print("\n📋 最近的控制台日志:")
                    for msg in console_messages[-10:]:
                        print(f"  {msg}")
                else:
                    print("❌ 未找到 '测试当前声音' 按钮")
            else:
                print("❌ 未找到 '开启听写' 按钮")
        else:
            print("⚠️ 未找到 '开始练习' 按钮，可能已经在练习页面")

        # Keep browser open for manual inspection
        print("\n⏸️ 浏览器保持打开，等待30秒供手动检查...")
        page.wait_for_timeout(30000)

        browser.close()
        print("\n✅ 测试完成！")


if __name__ == "__main__":
    test_dictation_app()
