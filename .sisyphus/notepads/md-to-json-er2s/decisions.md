# Decisions - MD to JSON Conversion (二年级上册)

## [2026-02-07] User Choice
- Store original lesson names (lessonName field)
- Display using item.lessonName in app, not hardcoded "单元X"

## [2026-02-07] JSON Structure
```json
{
  "word": "词语",
  "pinyin": "",
  "grade": "二年级",
  "semester": "上册",
  "unit": 数字,
  "lessonName": "阅读1"
}
```
