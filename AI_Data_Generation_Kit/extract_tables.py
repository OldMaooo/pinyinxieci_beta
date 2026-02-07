#!/usr/bin/env python3
import pdfplumber
import re


def extract_tables(pdf_path):
    words_by_unit = {}
    chars_by_unit = {}

    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue

            # 找到识字表和写字表的页面
            if "识字表" in text or "词语表" in text:
                print(f"\n=== 第{i + 1}页 - 识字/词语表 ===")
                current_unit = None
                current_words = []

                for line in text.split("\n"):
                    # 检测单元标题
                    unit_match = re.match(
                        r"(第[一二三四五六七八九十]+单元|语文园地[一二三四五六七八九十]+|识字[一二三四五六七八九十]*)",
                        line,
                    )
                    if unit_match:
                        if current_unit and current_words:
                            words_by_unit[current_unit] = current_words[:]
                        current_unit = unit_match.group(1)
                        current_words = []
                        print(f"\n发现单元: {current_unit}")
                        continue

                    # 跳过标题行
                    if "识字表" in line or "页码" in line or "词语表" in line:
                        continue

                    # 提取词语（至少2个汉字）
                    words = re.findall(r"[\u4e00-\u9fff]{2,}", line)
                    if words:
                        current_words.extend(words)

                if current_unit and current_words:
                    words_by_unit[current_unit] = current_words[:]

            elif "写字表" in text:
                print(f"\n=== 第{i + 1}页 - 写字表 ===")
                current_unit = None
                current_chars = []

                for line in text.split("\n"):
                    unit_match = re.match(
                        r"(第[一二三四五六七八九十]+单元|语文园地[一二三四五六七八九十]+)",
                        line,
                    )
                    if unit_match:
                        if current_unit and current_chars:
                            chars_by_unit[current_unit] = current_chars[:]
                        current_unit = unit_match.group(1)
                        current_chars = []
                        print(f"\n发现单元: {current_unit}")
                        continue

                    if "写字表" in line or "页码" in line:
                        continue

                    # 提取单字
                    chars = re.findall(r"[\u4e00-\u9fff]", line)
                    if chars:
                        current_chars.extend(chars)

                if current_unit and current_chars:
                    chars_by_unit[current_unit] = current_chars[:]

    return words_by_unit, chars_by_unit


if __name__ == "__main__":
    pdf_path = "/Users/mao/Documents/Coding/Development/Projects/Web/kanpinyinxieci_semiauto/dist/data/【人教版】一年级上册(2024秋版)语文电子课本.pdf"

    print("正在提取...")
    words, chars = extract_tables(pdf_path)

    print(f"\n\n{'=' * 60}")
    print("词语表（识字表）")
    print("=" * 60)
    for unit, ws in sorted(
        words.items(), key=lambda x: (not x[0].startswith("第"), x[0])
    ):
        print(f"\n{unit} ({len(ws)}词):")
        print(", ".join(ws[:20]) + ("..." if len(ws) > 20 else ""))

    print(f"\n\n{'=' * 60}")
    print("写字表")
    print("=" * 60)
    for unit, cs in sorted(
        chars.items(), key=lambda x: (not x[0].startswith("第"), x[0])
    ):
        print(f"\n{unit} ({len(cs)}字):")
        print("".join(cs[:30]) + ("..." if len(cs) > 30 else ""))
