#!/usr/bin/env python3
"""
PSLE RevisionPro — Question Loader
Bulk inserts parsed question JSON into Supabase questions table.

Usage:
    python3 load_questions.py --file questions_agriculture_std6.json
    python3 load_questions.py --file questions_english_std6.json --dry-run
    python3 load_questions.py --file questions_mixed_std6.json --chunk 50

Environment (or pass as flags):
    SUPABASE_URL   = https://zkttvqrojyoeinhyycgd.supabase.co
    SUPABASE_KEY   = your-service-role-key
"""

import json
import os
import sys
import argparse
import time
from pathlib import Path

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://zkttvqrojyoeinhyycgd.supabase.co")

# ─── Supabase REST insert (no SDK needed) ──────────────────────────────────────

def supabase_insert(records: list[dict], table: str, url: str, key: str,
                    upsert: bool = False, dry_run: bool = False) -> dict:
    """Insert records into Supabase via REST API."""
    import urllib.request
    import urllib.error

    endpoint = f"{url}/rest/v1/{table}"
    headers = {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Prefer": "return=minimal",
    }
    if upsert:
        headers["Prefer"] = "resolution=merge-duplicates,return=minimal"

    payload = json.dumps(records, ensure_ascii=False).encode("utf-8")

    if dry_run:
        print(f"  [DRY RUN] Would POST {len(records)} records to {endpoint}")
        print(f"  Sample: {json.dumps(records[0], indent=2)[:400]}")
        return {"dry_run": True, "count": len(records)}

    req = urllib.request.Request(endpoint, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return {"status": resp.status, "count": len(records)}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return {"error": f"HTTP {e.code}: {body[:500]}"}
    except Exception as e:
        return {"error": str(e)}


# ─── Schema validation ──────────────────────────────────────────────────────────

REQUIRED_COLUMNS = {"question_text", "option_a", "option_b", "option_c", "option_d", "subject", "standard"}

VALID_SUBJECTS = {"Agriculture", "English", "Social Studies", "Setswana", "RME", "Maths", "Science"}

def validate_record(q: dict, idx: int) -> list[str]:
    errs = []
    for col in REQUIRED_COLUMNS:
        if not q.get(col):
            errs.append(f"missing {col}")
    if q.get("subject") and q["subject"] not in VALID_SUBJECTS:
        errs.append(f"unknown subject: {q['subject']!r}")
    if q.get("standard") and q["standard"] not in (6, 7):
        errs.append(f"invalid standard: {q['standard']}")
    if q.get("correct_answer") and q["correct_answer"] not in ("A", "B", "C", "D", None):
        errs.append(f"invalid correct_answer: {q['correct_answer']!r}")
    return errs


def prepare_record(q: dict) -> dict:
    """Coerce types and set defaults before insert."""
    return {
        "question_text": str(q.get("question_text", "")).strip(),
        "option_a": str(q.get("option_a", "")).strip(),
        "option_b": str(q.get("option_b", "")).strip(),
        "option_c": str(q.get("option_c", "")).strip(),
        "option_d": str(q.get("option_d", "")).strip(),
        "correct_answer": q.get("correct_answer"),  # nullable
        "subject": q.get("subject", "").strip(),
        "standard": int(q.get("standard", 6)),
        "difficulty": int(q.get("difficulty", 2)),
        "blooms_level": q.get("blooms_level", "Remember"),
        "blooms_level_num": int(q.get("blooms_level_num", 1)),
        "topic_tags": q.get("topic_tags", []),
        "subject_area": q.get("subject_area", "").strip() or q.get("subject", "").lower(),
        "paper_id": q.get("paper_id", ""),
        "explanation": q.get("explanation"),
        "diagram_svg": q.get("diagram_svg"),
    }


# ─── Main ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Load parsed PSLE questions into Supabase")
    parser.add_argument("--file", required=True, help="JSON file from parse_exam_papers.py")
    parser.add_argument("--url", default=SUPABASE_URL, help="Supabase project URL")
    parser.add_argument("--key", default=os.getenv("SUPABASE_KEY"), help="Supabase service role key")
    parser.add_argument("--table", default="questions", help="Target table (default: questions)")
    parser.add_argument("--chunk", type=int, default=100, help="Records per batch (default: 100)")
    parser.add_argument("--dry-run", action="store_true", help="Validate + preview, no insert")
    parser.add_argument("--upsert", action="store_true", help="Use upsert (skip exact duplicates)")
    args = parser.parse_args()

    if not args.dry_run and not args.key:
        print("✗ SUPABASE_KEY not set. Export it or use --key flag.")
        print("  export SUPABASE_KEY=your-service-role-key")
        sys.exit(1)

    # Load JSON
    path = Path(args.file)
    if not path.exists():
        print(f"✗ File not found: {path}")
        sys.exit(1)

    with open(path, encoding="utf-8") as f:
        raw = json.load(f)

    print(f"Loaded {len(raw)} records from {path.name}")

    # Validate
    valid = []
    skipped = 0
    for i, q in enumerate(raw):
        errs = validate_record(q, i)
        if errs:
            print(f"  Row {i+1} SKIP: {', '.join(errs)}")
            skipped += 1
        else:
            valid.append(prepare_record(q))

    print(f"Valid: {len(valid)} | Skipped: {skipped}")

    if not valid:
        print("✗ Nothing to insert.")
        sys.exit(1)

    # Summary by subject
    from collections import Counter
    subj_counts = Counter(q["subject"] for q in valid)
    print("\nSubject breakdown:")
    for subj, n in sorted(subj_counts.items()):
        answered = sum(1 for q in valid if q["subject"] == subj and q.get("correct_answer"))
        print(f"  {subj}: {n} questions ({answered} with answers)")

    if args.dry_run:
        print(f"\n[DRY RUN] Would insert {len(valid)} records into {args.table}")
        print("\nSample record:")
        print(json.dumps(valid[0], indent=2))
        return

    # Chunked insert
    print(f"\nInserting in chunks of {args.chunk}...")
    total_inserted = 0
    errors = []

    for i in range(0, len(valid), args.chunk):
        chunk = valid[i:i + args.chunk]
        chunk_num = (i // args.chunk) + 1
        total_chunks = (len(valid) + args.chunk - 1) // args.chunk
        print(f"  Chunk {chunk_num}/{total_chunks} ({len(chunk)} records)...", end=" ", flush=True)

        result = supabase_insert(chunk, args.table, args.url, args.key,
                                 upsert=args.upsert, dry_run=args.dry_run)

        if "error" in result:
            print(f"✗ ERROR: {result['error']}")
            errors.append((chunk_num, result["error"]))
            # Continue with remaining chunks
        else:
            print(f"✓ {result.get('count', len(chunk))} inserted")
            total_inserted += len(chunk)

        time.sleep(0.1)  # gentle rate limiting

    # Final summary
    print(f"\n{'='*50}")
    print(f"✓ Inserted: {total_inserted}/{len(valid)} records")
    if errors:
        print(f"✗ Errors in {len(errors)} chunk(s):")
        for chunk_num, err in errors:
            print(f"  Chunk {chunk_num}: {err[:200]}")
    else:
        print("  No errors.")

    print(f"\nVerify in Supabase:")
    print(f"  {args.url}/rest/v1/{args.table}?subject=eq.Agriculture&select=count")


if __name__ == "__main__":
    main()
