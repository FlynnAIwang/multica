#!/usr/bin/env python3
"""稳卖：把 zh-Hans 文案改写成面向跨境电商业务负责人的非技术语言。

只改 value，不改 key；{{占位符}} 保持不变。
以上游提交 BASE 的原文为输入，可反复运行（幂等）。
用法：python3 scripts/wenmai/rewrite_zh_copy.py
"""
import json, re, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
LOC = ROOT / "packages/views/locales/zh-Hans"
BASE = "6eea142"  # upstream/main at fork time
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from zh_overrides import OVERRIDES  # noqa: E402

CJK = r"　-〿一-鿿＀-￯"


def en_term(pattern, zh):
    """Replace an English term embedded in Chinese text, fixing spacing."""
    rx = re.compile(r"( ?)(?<![\w./{-])(" + pattern + r")(?![\w./}-])( ?)")

    def sub(m):
        s, e = m.start(), m.end()
        text = m.string
        left = text[s - 1] if s > 0 else ""
        right = text[e] if e < len(text) else ""
        lead = " " if m.group(1) and left and re.match(r"[A-Za-z0-9}\)]", left) else ""
        trail = " " if m.group(3) and right and re.match(r"[A-Za-z0-9{\(]", right) else ""
        return lead + zh + trail

    return lambda v: rx.sub(sub, v)


def plain(old, new):
    return lambda v: v.replace(old, new)


RULES = [
    # 核心概念
    plain("AI 智能体", "AI 员工"),
    plain("智能体", "AI 员工"),
    plain("小队", "小组"),
    plain("队长", "组长"),
    plain("自动化", "例行任务"),
    lambda v: re.sub(r"(?<!开始)(?<!每次)(?<!下次)运行时(?![间长])", "运行环境", v),
    plain("守护进程", "后台服务"),
    en_term(r"[Ss]kills?", "技能"),
    en_term(r"[Hh]arness(?:es)?", "AI 工具"),
    # 导航 / 模块
    plain("收件箱", "消息中心"),
    plain("聊天会话", "对话"),
    plain("聊天", "对话"),
    # 任务状态
    lambda v: "所有者" if v == "owner" else v,
    plain("待规划", "待安排"),
    plain("审核中", "待验收"),
    plain("已阻塞", "已卡住"),
    plain("被阻塞", "卡住了"),
    # 中文里的空格修正：“的 AI 员工” 前面已有空格时不重复
    lambda v: re.sub(r"  +AI 员工", " AI 员工", v),
    lambda v: re.sub(r"(?<=[A-Za-z0-9}]) ?AI 员工", " AI 员工", v),
    lambda v: re.sub(r"(?<=[一-鿿])(AI 员工|AI 工具)", r" \1", v),
    lambda v: re.sub(r"^ AI 员工", "AI 员工", v),
]


def transform(value):
    for r in RULES:
        value = r(value)
    return value


def walk(obj, path, fname):
    if isinstance(obj, dict):
        return {k: walk(v, path + [k], fname) for k, v in obj.items()}
    if isinstance(obj, list):
        return [walk(v, path + [str(i)], fname) for i, v in enumerate(obj)]
    if isinstance(obj, str):
        key = fname + ":" + ".".join(path)
        if key in OVERRIDES:
            return OVERRIDES[key]
        return transform(obj)
    return obj


def placeholders(s):
    return sorted(re.findall(r"\{\{[^}]+\}\}", s))


def check(orig, new, path=""):
    if isinstance(orig, dict):
        assert orig.keys() == new.keys(), path
        for k in orig:
            check(orig[k], new[k], path + "." + k)
    elif isinstance(orig, str):
        if placeholders(orig) != placeholders(new):
            raise SystemExit(f"placeholder mismatch at {path}: {orig!r} -> {new!r}")


def main():
    used = set()
    for f in sorted(LOC.glob("*.json")):
        rel = f.relative_to(ROOT).as_posix()
        src = subprocess.run(["git", "show", f"{BASE}:{rel}"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout
        orig = json.loads(src)
        new = walk(orig, [], f.stem)
        check(orig, new, f.stem)
        used |= {k for k in OVERRIDES if k.startswith(f.stem + ":")}
        f.write_text(json.dumps(new, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    missing = set(OVERRIDES) - used
    # verify every override key actually exists
    for k in sorted(OVERRIDES):
        fname, path = k.split(":", 1)
        d = json.loads((LOC / f"{fname}.json").read_text())
        for p in path.split("."):
            if not isinstance(d, dict) or p not in d:
                raise SystemExit(f"override key not found: {k}")
            d = d[p]
    print("ok:", len(OVERRIDES), "overrides")


if __name__ == "__main__":
    main()
