"""CourSys API client for fetching course listings."""

import httpx
from dataclasses import dataclass

# API endpoint
COURSYS_URL = "https://coursys.sfu.ca/browse/"


@dataclass
class CoursysEntry:
    """Parsed course entry from CourSys API."""

    term: str
    course_code: str  # e.g., "CMPT 120"
    section: str  # e.g., "D100"
    department: str  # e.g., "CMPT"
    course_number: str  # e.g., "120"
    title: str
    enrollment: str  # e.g., "0/200"
    instructor: str
    campus: str


def parse_course_code(raw_code: str) -> tuple[str, str, str, str]:
    """
    Parse course code string into components.

    Args:
        raw_code: e.g., "CMPT 120 D100" or "ALS 603 G100"

    Returns:
        (department, number, section, full_code)
        e.g., ("CMPT", "120", "D100", "CMPT 120")
    """
    # Remove HTML tags if present (CourSys wraps in <a> tags)
    import re

    clean = re.sub(r"<[^>]+>", "", raw_code).strip()

    parts = clean.split()
    if len(parts) >= 3:
        dept = parts[0]
        num = parts[1]
        section = parts[2]
        return dept, num, section, f"{dept} {num}"
    elif len(parts) == 2:
        # No section
        return parts[0], parts[1], "", f"{parts[0]} {parts[1]}"
    else:
        return "", "", "", clean


async def fetch_coursys_courses(
    semester: str = "1264",
    timeout: float = 60.0,
    page_size: int = 500,
    max_pages: int = 10,
) -> list[CoursysEntry]:
    """
    Fetch all courses from CourSys for a given semester.

    Uses pagination to fetch all results from the DataTables API.

    Args:
        semester: Semester code (e.g., "1264" for Summer 2026)
        timeout: Request timeout in seconds
        page_size: Number of records per page (max ~500 recommended)
        max_pages: Maximum pages to fetch (safety limit)

    Returns:
        List of parsed course entries
    """
    courses: list[CoursysEntry] = []
    start = 0
    total_records = None

    async with httpx.AsyncClient(timeout=timeout) as client:
        for page in range(max_pages):
            # Build URL with proper array parameter format
            # semester[]=1264 is the correct format for filtering
            url = (
                f"{COURSYS_URL}?tabledata=yes"
                f"&semester%5B%5D={semester}"  # semester[]=1264
                f"&start={start}"
                f"&length={page_size}"
                f"&order%5B0%5D%5Bcolumn%5D=1"  # Sort by course code
                f"&order%5B0%5D%5Bdir%5D=asc"
            )

            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            if data.get("result") != "ok":
                raise ValueError(f"CourSys API error: {data}")

            # Get total on first request
            if total_records is None:
                total_records = data.get("recordsFiltered", 0)

            rows = data.get("data", [])
            if not rows:
                break

            for row in rows:
                entry = _parse_coursys_row(row)
                if entry:
                    courses.append(entry)

            # Check if we've fetched all records
            start += len(rows)
            if start >= total_records:
                break

    return courses


def _parse_coursys_row(row: list) -> CoursysEntry | None:
    """Parse a single row from CourSys API response."""
    if len(row) < 6:
        return None

    term = _clean_html(row[0])
    raw_code = row[1]
    title = _clean_html(row[2])
    enrollment = _clean_html(row[3])
    instructor = _clean_html(row[4])
    campus = _clean_html(row[5])

    dept, num, section, course_code = parse_course_code(raw_code)

    if not dept or not num:
        return None

    return CoursysEntry(
        term=term,
        course_code=course_code,
        section=section,
        department=dept,
        course_number=num,
        title=title,
        enrollment=enrollment,
        instructor=instructor if instructor != "—" else "",
        campus=campus,
    )


def _clean_html(text: str) -> str:
    """Remove HTML tags and clean whitespace."""
    import re

    if not text:
        return ""
    # Remove HTML tags
    clean = re.sub(r"<[^>]+>", "", str(text))
    # Normalize whitespace
    clean = " ".join(clean.split())
    return clean.strip()
