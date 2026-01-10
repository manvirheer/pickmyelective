#!/usr/bin/env python3
"""Evaluate different ranking approaches for course recommendations.

Compares relevance-only, elective-only, and hybrid ranking formulas
using proxy metrics across a set of test queries.
"""

import asyncio
import json
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Callable

from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from scipy import stats
import numpy as np

# Load environment variables
load_dotenv(Path(__file__).parent.parent / ".env")

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from query.engine import QueryEngine
from query.models import QueryFilters


console = Console()


# =============================================================================
# Test Queries (from QUERY_EXAMPLES.md)
# =============================================================================

TEST_QUERIES = [
    # Topic-based (no filters)
    {"query": "learn about climate change and environment", "filters": {}},
    {"query": "history and ancient civilizations", "filters": {}},
    {"query": "business and entrepreneurship", "filters": {}},
    {"query": "film movies cinema", "filters": {}},
    # Filtered queries
    {
        "query": "interesting course for computer science student",
        "filters": {"wqb": ["B-Hum"]},
    },
    {"query": "math and statistics", "filters": {"wqb": ["Q"]}},
    {"query": "philosophy and ethics", "filters": {"wqb": ["B-Hum"]}},
    {"query": "writing intensive essay course", "filters": {"wqb": ["W"]}},
    # Beginner-friendly
    {
        "query": "beginner friendly course",
        "filters": {"no_prerequisites": True, "max_level": 100},
    },
    {"query": "bird course easy A", "filters": {}},
    # Specialized topics
    {"query": "learn a new language", "filters": {}},
    {"query": "courses about food nutrition diet", "filters": {}},
    {"query": "social issues and politics", "filters": {}},
    # Additional queries for statistical power
    {"query": "psychology human behavior", "filters": {}},
    {
        "query": "computer science programming",
        "filters": {"exclude_departments": ["CMPT"]},
    },
    {"query": "creative arts and design", "filters": {}},
    {"query": "economics and finance", "filters": {}},
    {"query": "music and performance", "filters": {}},
    {"query": "health and medicine", "filters": {"wqb": ["B-Sci"]}},
    {"query": "environmental sustainability", "filters": {}},
    {"query": "communication and media", "filters": {}},
    {"query": "mathematics for beginners", "filters": {"no_prerequisites": True}},
    {"query": "indigenous studies culture", "filters": {}},
]


# =============================================================================
# Ranking Formulas
# =============================================================================


def normalize_elective(score: int, max_score: int = 25) -> float:
    """Normalize elective score from 0-25 to 0-1."""
    return score / max_score


@dataclass
class RankingFormula:
    """A ranking formula to evaluate."""

    name: str
    description: str
    compute: Callable[[float, int], float]  # (relevance, elective) -> combined


RANKING_FORMULAS = [
    RankingFormula(
        name="relevance_only",
        description="Current: 100% relevance",
        compute=lambda rel, elec: rel,
    ),
    RankingFormula(
        name="elective_only",
        description="100% elective score",
        compute=lambda rel, elec: normalize_elective(elec),
    ),
    RankingFormula(
        name="balanced_50_50",
        description="50% rel + 50% elec",
        compute=lambda rel, elec: 0.5 * rel + 0.5 * normalize_elective(elec),
    ),
    RankingFormula(
        name="relevance_70_30",
        description="70% rel + 30% elec",
        compute=lambda rel, elec: 0.7 * rel + 0.3 * normalize_elective(elec),
    ),
    RankingFormula(
        name="relevance_80_20",
        description="80% rel + 20% elec",
        compute=lambda rel, elec: 0.8 * rel + 0.2 * normalize_elective(elec),
    ),
    RankingFormula(
        name="multiplicative",
        description="rel * (1 + 0.5*elec)",
        compute=lambda rel, elec: rel * (1 + 0.5 * normalize_elective(elec)),
    ),
    RankingFormula(
        name="threshold_boost",
        description="rel + 0.1 if elec>=15",
        compute=lambda rel, elec: rel + (0.1 if elec >= 15 else 0),
    ),
]


# =============================================================================
# Metrics
# =============================================================================


@dataclass
class QueryResult:
    """Results for a single query."""

    query: str
    results: list[dict] = field(default_factory=list)


@dataclass
class EvaluationMetrics:
    """Metrics for a ranking formula across all queries."""

    formula_name: str
    description: str

    # Score correlation metrics
    pearson_correlation: float = 0.0
    spearman_correlation: float = 0.0

    # Missed opportunity metrics
    high_elective_avg_rank: float = 0.0
    high_elective_in_top_3_pct: float = 0.0

    # Quality proxy metrics
    avg_wqb_top5_pct: float = 0.0
    avg_no_prereq_top5_pct: float = 0.0
    avg_elective_score_top5: float = 0.0

    # Stability metrics
    avg_rank_change: float = 0.0
    top3_stability_pct: float = 0.0


def compute_metrics(
    results: list[QueryResult],
    formula: RankingFormula,
    baseline_results: list[QueryResult] | None = None,
) -> EvaluationMetrics:
    """Compute all metrics for a formula's results."""
    all_relevance = []
    all_elective = []
    all_wqb_top5 = []
    all_no_prereq_top5 = []
    all_elective_top5 = []
    high_elective_ranks = []
    high_elective_in_top3_count = 0

    for qr in results:
        if not qr.results:
            continue

        for r in qr.results:
            all_relevance.append(r["relevance_score"])
            all_elective.append(r["elective_score"])

            if r["elective_score"] >= 15:
                high_elective_ranks.append(r["rank"])

        # Top 5 analysis
        top5 = sorted(qr.results, key=lambda x: x["combined_score"], reverse=True)[:5]
        if top5:
            wqb_count = sum(1 for c in top5 if c["has_wqb"])
            no_prereq_count = sum(1 for c in top5 if not c["has_prerequisites"])

            all_wqb_top5.append(wqb_count / len(top5) * 100)
            all_no_prereq_top5.append(no_prereq_count / len(top5) * 100)
            all_elective_top5.append(np.mean([c["elective_score"] for c in top5]))

            # High elective in top 3
            top3 = top5[:3]
            if any(c["elective_score"] >= 15 for c in top3):
                high_elective_in_top3_count += 1

    # Correlation
    pearson_r = 0.0
    spearman_r = 0.0
    if len(all_relevance) > 2:
        try:
            pearson_r, _ = stats.pearsonr(all_relevance, all_elective)
            spearman_r, _ = stats.spearmanr(all_relevance, all_elective)
        except Exception:
            pass

    # Stability vs baseline
    avg_rank_change = 0.0
    top3_stability = 100.0

    if baseline_results and formula.name != "relevance_only":
        rank_changes = []
        top3_shared_list = []

        for i, qr in enumerate(results):
            if i >= len(baseline_results) or not qr.results or not baseline_results[i].results:
                continue

            base_qr = baseline_results[i]

            # Top 3 stability
            base_top3 = set(r["course_code"] for r in base_qr.results[:3])
            curr_top3 = set(r["course_code"] for r in qr.results[:3])
            if base_top3:
                top3_shared_list.append(len(base_top3 & curr_top3) / 3 * 100)

            # Rank changes
            base_ranks = {r["course_code"]: r["rank"] for r in base_qr.results}
            for r in qr.results:
                if r["course_code"] in base_ranks:
                    rank_changes.append(abs(r["rank"] - base_ranks[r["course_code"]]))

        if rank_changes:
            avg_rank_change = np.mean(rank_changes)
        if top3_shared_list:
            top3_stability = np.mean(top3_shared_list)

    valid_queries = len([qr for qr in results if qr.results])

    return EvaluationMetrics(
        formula_name=formula.name,
        description=formula.description,
        pearson_correlation=round(pearson_r, 3) if not np.isnan(pearson_r) else 0.0,
        spearman_correlation=round(spearman_r, 3) if not np.isnan(spearman_r) else 0.0,
        high_elective_avg_rank=round(np.mean(high_elective_ranks), 1) if high_elective_ranks else 0.0,
        high_elective_in_top_3_pct=round(high_elective_in_top3_count / valid_queries * 100, 1) if valid_queries else 0.0,
        avg_wqb_top5_pct=round(np.mean(all_wqb_top5), 1) if all_wqb_top5 else 0.0,
        avg_no_prereq_top5_pct=round(np.mean(all_no_prereq_top5), 1) if all_no_prereq_top5 else 0.0,
        avg_elective_score_top5=round(np.mean(all_elective_top5), 1) if all_elective_top5 else 0.0,
        avg_rank_change=round(avg_rank_change, 2),
        top3_stability_pct=round(top3_stability, 1),
    )


# =============================================================================
# Evaluation Runner
# =============================================================================


async def run_evaluation(
    engine: QueryEngine,
    queries: list[dict],
    formulas: list[RankingFormula],
    fetch_count: int = 20,
) -> dict[str, EvaluationMetrics]:
    """Run full evaluation across all queries and formulas."""

    results_by_formula: dict[str, list[QueryResult]] = {f.name: [] for f in formulas}

    console.print(f"\n[yellow]Running {len(queries)} queries...[/yellow]\n")

    for idx, query_spec in enumerate(queries):
        query = query_spec["query"]
        filter_dict = query_spec.get("filters", {})
        filters = QueryFilters(**filter_dict)

        console.print(f"  [{idx+1}/{len(queries)}] {query[:50]}...")

        try:
            # Get interpretation and embedding
            interpretation = await engine.interpret_query(query)
            search_text = " ".join(interpretation.topics)
            query_embedding = await engine.embed_query(search_text)

            # Search with no top-k limit to get all candidates
            candidates = engine.search_courses(
                query_embedding=query_embedding,
                filters=filters,
                n_results=fetch_count,
            )

            # For each formula, compute combined scores and rankings
            for formula in formulas:
                ranked_results = []
                for c in candidates:
                    elective_score = c["metadata"].get("elective_score", 0)
                    combined = formula.compute(c["relevance_score"], elective_score)
                    ranked_results.append(
                        {
                            "course_code": c["metadata"].get("course_code", ""),
                            "relevance_score": c["relevance_score"],
                            "elective_score": elective_score,
                            "combined_score": combined,
                            "has_wqb": c["metadata"].get("has_wqb", False),
                            "has_prerequisites": c["metadata"].get("has_prerequisites", False),
                        }
                    )

                # Sort by combined score and assign ranks
                ranked_results.sort(key=lambda x: x["combined_score"], reverse=True)
                for i, r in enumerate(ranked_results):
                    r["rank"] = i + 1

                results_by_formula[formula.name].append(
                    QueryResult(query=query, results=ranked_results)
                )

        except Exception as e:
            console.print(f"    [red]Error: {e}[/red]")
            for formula in formulas:
                results_by_formula[formula.name].append(QueryResult(query=query, results=[]))

    # Compute metrics for each formula
    console.print("\n[yellow]Computing metrics...[/yellow]\n")

    metrics = {}
    baseline_results = results_by_formula["relevance_only"]

    for formula in formulas:
        m = compute_metrics(
            results_by_formula[formula.name],
            formula,
            baseline_results if formula.name != "relevance_only" else None,
        )
        metrics[formula.name] = m

    return metrics


# =============================================================================
# Output
# =============================================================================


def print_summary_table(metrics: dict[str, EvaluationMetrics]) -> None:
    """Print comparison table of all ranking approaches."""

    table = Table(title="Ranking Approach Comparison", show_lines=True)

    table.add_column("Formula", style="cyan", width=18)
    table.add_column("Description", style="dim", width=20)
    table.add_column("High-Elec\nAvg Rank", justify="right", width=10)
    table.add_column("High-Elec\nTop-3 %", justify="right", width=10)
    table.add_column("WQB\nTop-5 %", justify="right", width=9)
    table.add_column("No-Prereq\nTop-5 %", justify="right", width=10)
    table.add_column("Avg Elec\nTop-5", justify="right", width=9)
    table.add_column("Rank\nChange", justify="right", width=8)
    table.add_column("Top-3\nStable %", justify="right", width=9)

    for name, m in metrics.items():
        rank_change_str = f"{m.avg_rank_change:.1f}" if m.avg_rank_change > 0 else "-"
        stability_str = f"{m.top3_stability_pct:.0f}%" if name != "relevance_only" else "-"

        table.add_row(
            m.formula_name,
            m.description,
            f"{m.high_elective_avg_rank:.1f}" if m.high_elective_avg_rank > 0 else "-",
            f"{m.high_elective_in_top_3_pct:.0f}%",
            f"{m.avg_wqb_top5_pct:.0f}%",
            f"{m.avg_no_prereq_top5_pct:.0f}%",
            f"{m.avg_elective_score_top5:.1f}",
            rank_change_str,
            stability_str,
        )

    console.print(table)


def print_correlation_table(metrics: dict[str, EvaluationMetrics]) -> None:
    """Print correlation between relevance and elective scores."""
    # Only need to show once since correlation is computed from same underlying data
    m = list(metrics.values())[0]
    console.print(
        Panel(
            f"Pearson r:  {m.pearson_correlation:.3f}\n"
            f"Spearman r: {m.spearman_correlation:.3f}",
            title="Relevance vs Elective Score Correlation",
        )
    )


def print_recommendations(metrics: dict[str, EvaluationMetrics]) -> None:
    """Print analysis and recommendations."""
    console.print("\n[bold]Analysis Summary[/bold]\n")

    # Best for surfacing high-elective courses
    by_high_elec = sorted(
        [(n, m) for n, m in metrics.items() if m.high_elective_avg_rank > 0],
        key=lambda x: x[1].high_elective_avg_rank,
    )
    if by_high_elec:
        console.print(f"  Best for surfacing quality courses: [green]{by_high_elec[0][0]}[/green]")
        console.print(f"    (High-elective courses appear at avg rank {by_high_elec[0][1].high_elective_avg_rank})")

    # Best for WQB coverage
    by_wqb = sorted(metrics.items(), key=lambda x: x[1].avg_wqb_top5_pct, reverse=True)
    console.print(f"  Best WQB coverage in top-5: [green]{by_wqb[0][0]}[/green] ({by_wqb[0][1].avg_wqb_top5_pct:.0f}%)")

    # Best for accessibility (no prereqs)
    by_prereq = sorted(metrics.items(), key=lambda x: x[1].avg_no_prereq_top5_pct, reverse=True)
    console.print(f"  Best accessibility (no prereqs): [green]{by_prereq[0][0]}[/green] ({by_prereq[0][1].avg_no_prereq_top5_pct:.0f}%)")

    # Most stable vs current
    by_stability = sorted(
        [(n, m) for n, m in metrics.items() if n != "relevance_only"],
        key=lambda x: x[1].top3_stability_pct,
        reverse=True,
    )
    if by_stability:
        console.print(f"  Most similar to current ranking: [green]{by_stability[0][0]}[/green] ({by_stability[0][1].top3_stability_pct:.0f}% top-3 overlap)")

    # Recommendation
    console.print("\n[bold]Recommendation[/bold]\n")

    # Find formula with best balance: high elective surfacing + reasonable stability
    # Score = high_elec_top3 + wqb_pct + no_prereq_pct - rank_change*2
    scores = {}
    for name, m in metrics.items():
        if name == "relevance_only":
            scores[name] = m.high_elective_in_top_3_pct + m.avg_wqb_top5_pct + m.avg_no_prereq_top5_pct
        else:
            scores[name] = (
                m.high_elective_in_top_3_pct
                + m.avg_wqb_top5_pct
                + m.avg_no_prereq_top5_pct
                - m.avg_rank_change * 2
            )

    best = max(scores.items(), key=lambda x: x[1])
    console.print(f"  Based on quality metrics: [bold green]{best[0]}[/bold green]")

    if best[0] != "relevance_only":
        m = metrics[best[0]]
        console.print(f"    - Surfaces high-quality courses {m.high_elective_in_top_3_pct:.0f}% of queries")
        console.print(f"    - {m.avg_wqb_top5_pct:.0f}% WQB courses in top-5")
        console.print(f"    - {m.avg_no_prereq_top5_pct:.0f}% accessible (no prereqs) in top-5")
        console.print(f"    - {m.top3_stability_pct:.0f}% overlap with current ranking")


# =============================================================================
# Main
# =============================================================================


async def main() -> None:
    console.print(Panel("[bold blue]Course Ranking Evaluation Framework[/bold blue]"))

    # Initialize query engine
    chroma_path = Path(__file__).parent.parent / "data" / "chroma"
    collection_name = "courses_1264"

    if not chroma_path.exists():
        console.print(f"[red]ChromaDB not found at {chroma_path}[/red]")
        console.print("Run `python scripts/index_courses.py` first.")
        return

    console.print(f"Loading collection: {collection_name}")

    engine = QueryEngine(
        chroma_path=chroma_path,
        collection_name=collection_name,
    )

    # Run evaluation
    metrics = await run_evaluation(engine, TEST_QUERIES, RANKING_FORMULAS)

    # Output results
    console.print()
    print_correlation_table(metrics)
    console.print()
    print_summary_table(metrics)
    print_recommendations(metrics)

    # Export detailed results
    output_path = Path(__file__).parent.parent / "data" / "ranking_evaluation.json"
    with open(output_path, "w") as f:
        json.dump({name: asdict(m) for name, m in metrics.items()}, f, indent=2)

    console.print(f"\n[green]Results saved to: {output_path}[/green]")


if __name__ == "__main__":
    asyncio.run(main())
