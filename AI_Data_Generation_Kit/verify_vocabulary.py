#!/usr/bin/env python3
"""
词汇表验证工具
用于检查生成的词库数据是否符合规范

使用方法:
    python verify_vocabulary.py [json_file]

示例:
    python verify_vocabulary.py dist/data/一年级上册.json
"""

import json
import sys
from collections import defaultdict
from pathlib import Path


def load_json(file_path):
    """加载JSON文件"""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def check_duplicates(data):
    """检查重复词"""
    word_count = defaultdict(int)
    unit_word_count = defaultdict(lambda: defaultdict(int))

    for item in data["wordBank"]:
        word = item["word"]
        unit = str(item["unit"])

        word_count[word] += 1
        unit_word_count[unit][word] += 1

    duplicates = {}
    for word, count in word_count.items():
        if count > 1:
            duplicates[word] = count

    return duplicates, unit_word_count


def check_suspicious_words(data):
    """检查可疑词汇（可能是OCR错误）"""
    # 常见可疑模式
    suspicious_patterns = [
        r"^.[呱叭垃咱呐哪]$",  # 单字+生僻后缀
        r"^[天地人你我他金木水火土口耳目日月水火]$",  # 单字（应该是双字词）
    ]

    suspicious = []
    for item in data["wordBank"]:
        word = item["word"]
        # 检查过短的词
        if len(word) < 2:
            suspicious.append(
                {"word": word, "unit": item["unit"], "reason": "词太短（可能是单字）"}
            )

    return suspicious


def check_units(data):
    """检查单元完整性"""
    units = set()
    for item in data["wordBank"]:
        units.add(str(item["unit"]))

    # 期望的单元列表（可以根据实际情况调整）
    expected_units = [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "语文园地一",
        "语文园地二",
        "语文园地三",
        "语文园地四",
        "语文园地五",
        "语文园地六",
        "语文园地七",
        "语文园地八",
    ]

    found_units = units - {
        "语文园地一",
        "语文园地二",
        "语文园地三",
        "语文园地四",
        "语文园地五",
        "语文园地六",
        "语文园地七",
        "语文园地八",
    }

    return found_units


def analyze_word_sources(data):
    """分析词汇来源"""
    unit_stats = {}

    for item in data["wordBank"]:
        unit = str(item["unit"])
        if unit not in unit_stats:
            unit_stats[unit] = {"count": 0, "words": []}
        unit_stats[unit]["count"] = unit_stats[unit]["count"] + 1
        unit_stats[unit]["words"].append(item["word"])

    return unit_stats


def generate_report(file_path):
    """生成完整报告"""
    print(f"\n{'=' * 60}")
    print(f"词汇表验证报告")
    print(f"{'=' * 60}")
    print(f"文件: {file_path}\n")

    try:
        data = load_json(file_path)
    except Exception as e:
        print(f"❌ 加载文件失败: {e}")
        return

    # 基本信息
    print(f"📚 基本信息:")
    print(f"   年级: {data.get('gradeSemester', '未知')}")
    print(f"   词汇总数: {data.get('count', len(data['wordBank']))}")
    print(f"   实际词汇数: {len(data['wordBank'])}")

    # 检查重复词
    print(f"\n{'=' * 60}")
    print(f"🔍 重复词检查")
    print(f"{'=' * 60}")

    duplicates, unit_words = check_duplicates(data)
    if duplicates:
        print(f"❌ 发现 {len(duplicates)} 个重复词:\n")
        for word, count in sorted(duplicates.items(), key=lambda x: -x[1]):
            units = [u for u, words in unit_words.items() if word in words]
            print(f"   '{word}' - 出现 {count} 次")
            print(f"      所在单元: {', '.join(units)}")
    else:
        print(f"✅ 无重复词")

    # 检查可疑词汇
    print(f"\n{'=' * 60}")
    print(f"⚠️  可疑词汇检查")
    print(f"{'=' * 60}")

    suspicious = check_suspicious_words(data)
    if suspicious:
        print(f"⚠️  发现 {len(suspicious)} 个可疑词汇:\n")
        for item in suspicious[:20]:  # 只显示前20个
            print(f"   '{item['word']}' (单元{item['unit']}) - {item['reason']}")
        if len(suspicious) > 20:
            print(f"   ... 还有 {len(suspicious) - 20} 个")
    else:
        print(f"✅ 未发现可疑词汇")

    # 单元统计
    print(f"\n{'=' * 60}")
    print(f"📊 单元统计")
    print(f"{'=' * 60}")

    stats = analyze_word_sources(data)
    print(f"共有 {len(stats)} 个单元:\n")

    for unit, info in sorted(
        stats.items(),
        key=lambda x: (not x[0].isdigit(), int(x[0]) if x[0].isdigit() else 999, x[0]),
    ):
        print(f"   单元 {unit}: {info['count']} 个词")

    # 总结
    print(f"\n{'=' * 60}")
    print(f"📝 总结")
    print(f"{'=' * 60}")

    issues = []
    if duplicates:
        issues.append(f"有 {len(duplicates)} 个重复词")
    if suspicious:
        issues.append(f"有 {len(suspicious)} 个可疑词汇")

    if issues:
        print(f"❌ 需要修复: {', '.join(issues)}")
    else:
        print(f"✅ 词库质量良好")

    print(f"\n{'=' * 60}\n")


def main():
    if len(sys.argv) < 2:
        # 默认检查 dist/data 目录下的所有 JSON 文件
        data_dir = Path("dist/data")
        if data_dir.exists():
            json_files = list(data_dir.glob("*上册.json")) + list(
                data_dir.glob("*下册.json")
            )
            for f in sorted(json_files):
                generate_report(f)
        else:
            print("请提供 JSON 文件路径")
            print("用法: python verify_vocabulary.py <json_file>")
    else:
        generate_report(sys.argv[1])


if __name__ == "__main__":
    main()
