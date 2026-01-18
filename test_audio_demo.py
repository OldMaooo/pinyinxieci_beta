#!/usr/bin/env python3
"""
Test the audio demo page - verify UI and button interactions.
Note: Audio cannot be tested in headless browser mode - user must test audio manually.
"""

from playwright.sync_api import sync_playwright
import time


def test_audio_demo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the demo page
        html_path = "/Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto/demo-audio-test.html"
        page.goto(f"file://{html_path}")
        page.wait_for_load_state("networkidle")

        print("✅ Page loaded successfully")

        # Take screenshot for visual verification
        page.screenshot(path="/tmp/audio-demo-screenshot.png", full_page=True)
        print("✅ Screenshot saved to /tmp/audio-demo-screenshot.png")

        # Verify unlock button exists
        unlock_btn = page.locator("#unlockBtn")
        assert unlock_btn.is_visible(), "Unlock button not found"
        print("✅ Unlock button is visible")

        # Click unlock button
        unlock_btn.click()
        print("✅ Unlock button clicked")

        # Wait for unlock to complete
        page.wait_for_timeout(2000)

        # Verify button changed to "已解锁"
        assert "已解锁" in unlock_btn.inner_text()
        print("✅ Audio unlocked successfully")

        # Verify character cards are rendered
        cards = page.locator(".char-card")
        assert cards.count() == 3, f"Expected 3 character cards, found {cards.count()}"
        print("✅ All 3 character cards rendered")

        # Get text from cards
        char_texts = cards.all_inner_texts()
        for i, text in enumerate(char_texts):
            print(f"  Card {i + 1}: {text[:50]}...")

        # Try clicking play button on first card
        first_play_btn = page.locator("#play-0")
        assert first_play_btn.is_visible(), "First play button not found"
        first_play_btn.click()
        print("✅ First play button clicked")

        # Wait a moment
        page.wait_for_timeout(1000)

        # Check console logs
        console_messages = []
        page.on("console", lambda msg: console_messages.append(msg))

        print("\n📋 Console logs from page:")
        for msg in console_messages[-10:]:  # Last 10 messages
            print(f"  {msg.type}: {msg.text}")

        browser.close()
        print("\n✅ All UI tests passed!")
        print("⚠️  NOTE: Audio cannot be tested in headless mode.")
        print("   Please open the file in a real browser to test audio playback.")


if __name__ == "__main__":
    test_audio_demo()
