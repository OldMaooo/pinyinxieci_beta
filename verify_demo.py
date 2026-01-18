from playwright.sync_api import sync_playwright
import time


def test_demo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set a very long timeout for the server to be ready
        print("Navigating to http://localhost:5173/")
        try:
            page.goto("http://localhost:5173/", wait_until="networkidle", timeout=60000)
        except Exception as e:
            print(f"Navigation failed: {e}")
            # Try once more without networkidle
            page.goto("http://localhost:5173/", timeout=30000)

        print("Page loaded. URL:", page.url)

        # Take a screenshot of the initial state
        page.screenshot(path="/tmp/demo_initial.png")
        print("Screenshot saved to /tmp/demo_initial.png")

        # Print console messages
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        # Check if the component title exists
        title = page.query_selector("h1")
        if title:
            print("Found H1 title:", title.inner_text())
        else:
            print("H1 title not found")

        # Click on the first character button to ensure data is loaded
        buttons = page.query_selector_all("button")
        print(f"Found {len(buttons)} buttons")

        if len(buttons) > 0:
            print("Clicking first character button...")
            buttons[0].click()
            time.sleep(2)  # Wait for fetch

        # Check for SVG
        svg = page.query_selector("svg")
        if svg:
            print("SVG found!")
            print(
                "SVG inner HTML:",
                page.evaluate("svg => svg.innerHTML", svg)[:100],
                "...",
            )
        else:
            print("SVG NOT found")

        # Check for tree nodes
        tree_nodes = page.query_selector_all(".tree-node")
        print(f"Found {len(tree_nodes)} tree nodes")

        # Final screenshot
        page.screenshot(path="/tmp/demo_final.png")
        print("Final screenshot saved to /tmp/demo_final.png")

        browser.close()


if __name__ == "__main__":
    test_demo()
