#!/usr/bin/env python3
import pdfplumber


def dump_pages(pdf_path, start_page, end_page):
    """打印指定页面的所有文本"""
    with pdfplumber.open(pdf_path) as pdf:
        for i in range(start_page - 1, min(end_page, len(pdf.pages))):
            page = pdf.pages[i]
            text = page.extract_text()
            print(f"\n{'=' * 80}")
            print(f"第{i + 1}页")
            print("=" * 80)
            print(text)


if __name__ == "__main__":
    pdf_path = "/Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto/dist/data/【人教版】一年级上册(2024秋版)语文电子课本.pdf"

    # 识字表通常在105页左右，写字表在108页左右
    dump_pages(pdf_path, 100, 115)
