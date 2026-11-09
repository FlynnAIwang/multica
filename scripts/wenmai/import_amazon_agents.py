#!/usr/bin/env python3
"""Import the 4 Amazon data-source agents + their skills into a Multica workspace.

Source: GitHub FlynnAIwang/wenmai-ai-skills (main)
  智能体/Amazon数据源智能体设计方案/0X-*/AGENTS.md   -> agent instructions
  智能体/Amazon数据源智能体设计方案/技能清单.md        -> which skills each agent uses
  Skills/<skill-name>/**                             -> workspace skills

Usage:
  MULTICA_API=http://127.0.0.1:18080 MULTICA_TOKEN=... MULTICA_WORKSPACE_ID=... \
    python3 scripts/wenmai/import_amazon_agents.py <repo-checkout> [--runtime-name "稳卖 Agent"]

Idempotent: existing skills/agents with the same name are updated in place.
"""
import argparse, json, os, re, sys, urllib.request, urllib.error
from pathlib import Path

DESIGN = "智能体/Amazon数据源智能体设计方案"
AGENTS = [
    # (folder prefix, agent name, 技能清单 section keyword)
    ("01-", "卖家精灵调研", "卖家精灵"),
    ("02-", "Sorftime亚马逊调研", "Sorftime"),
    ("03-", "西柚流量洞察", "西柚"),
    ("04-", "SIF关键词分析", "SIF"),
]

API = os.environ.get("MULTICA_API", "http://127.0.0.1:18080").rstrip("/")
TOKEN = os.environ["MULTICA_TOKEN"]
WS = os.environ["MULTICA_WORKSPACE_ID"]


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "X-Workspace-ID": WS,
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path} -> {e.code}: {e.read().decode()[:400]}")


def as_list(d, key):
    return d if isinstance(d, list) else (d.get(key) or [])


def skill_sections(md):
    out, cur = {}, None
    for line in md.splitlines():
        if line.startswith("## "):
            cur = line[3:].strip()
            out[cur] = []
        elif cur:
            out[cur] += re.findall(r"(wenmai-[a-z0-9-]+)", line)
    return {k: list(dict.fromkeys(v)) for k, v in out.items()}


def read_skill(dirp: Path):
    content = (dirp / "SKILL.md").read_text(encoding="utf-8")
    m = re.search(r"^description:\s*(.+)$", content, re.M)
    desc = (m.group(1).strip().strip('"\'') if m else "")[:500]
    files = []
    for f in sorted(dirp.rglob("*")):
        if not f.is_file() or f.name == "SKILL.md" or "__pycache__" in f.parts:
            continue
        try:
            files.append({"path": f.relative_to(dirp).as_posix(),
                          "content": f.read_text(encoding="utf-8")})
        except UnicodeDecodeError:
            print(f"  skip binary {f}", file=sys.stderr)
    return desc, content, files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repo")
    ap.add_argument("--runtime-name", default="稳卖 Agent")
    ap.add_argument("--model", default="")
    a = ap.parse_args()
    repo = Path(a.repo)
    design = repo / DESIGN
    sections = skill_sections((design / "技能清单.md").read_text(encoding="utf-8"))

    runtimes = as_list(call("GET", f"/api/runtimes?workspace_id={WS}"), "runtimes")
    rt = [r for r in runtimes if r["name"].startswith(a.runtime_name)]
    if not rt:
        raise SystemExit(f"runtime '{a.runtime_name}' not registered yet — start the desktop client first")
    rt.sort(key=lambda r: r.get("status") != "online")
    runtime_id = rt[0]["id"]
    print("runtime:", rt[0]["name"], runtime_id, rt[0].get("status"))

    existing = {s["name"]: s for s in as_list(call("GET", "/api/skills"), "skills")}
    skill_ids = {}
    for prefix, name, key in AGENTS:
        sec = next(v for k, v in sections.items() if key in k)
        for sk in sec:
            if sk in skill_ids:
                continue
            desc, content, files = read_skill(repo / "Skills" / sk)
            if sk in existing:
                sid = existing[sk]["id"]
                call("PUT", f"/api/skills/{sid}", {"description": desc, "content": content})
                for f in files:
                    call("PUT", f"/api/skills/{sid}/files", f)
            else:
                sid = call("POST", "/api/skills", {"name": sk, "description": desc,
                                                   "content": content, "files": files})["id"]
            skill_ids[sk] = sid
        print(f"skills for {name}: {len(sec)}")

    agents = {g["name"]: g for g in as_list(call("GET", "/api/agents"), "agents")}
    for prefix, name, key in AGENTS:
        folder = next(p for p in design.iterdir() if p.name.startswith(prefix))
        instructions = (folder / "AGENTS.md").read_text(encoding="utf-8")
        m = re.search(r"## 定位\s+(.+?)\n\n", instructions, re.S)
        desc = (m.group(1).strip() if m else name)[:300]
        body = {"name": name, "description": desc, "instructions": instructions,
                "runtime_id": runtime_id, "visibility": "workspace"}
        if a.model:
            body["model"] = a.model
        if name in agents:
            aid = agents[name]["id"]
            call("PUT", f"/api/agents/{aid}", body)
        else:
            aid = call("POST", "/api/agents", body)["id"]
        sec = next(v for k, v in sections.items() if key in k)
        call("PUT", f"/api/agents/{aid}/skills", {"skill_ids": [skill_ids[s] for s in sec]})
        print(f"agent {name}: {aid} ({len(sec)} skills)")


if __name__ == "__main__":
    main()
