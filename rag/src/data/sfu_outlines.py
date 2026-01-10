"""SFU Course Outlines API client for fetching detailed course information."""

import httpx
from dataclasses import dataclass, field

# API endpoint
SFU_OUTLINES_BASE = "http://www.sfu.ca/bin/wcm/course-outlines"

# Semester code to term mapping
SEMESTER_TO_TERM = {
    "1261": ("2026", "spring"),
    "1264": ("2026", "summer"),
    "1267": ("2026", "fall"),
    "1251": ("2025", "spring"),
    "1254": ("2025", "summer"),
    "1257": ("2025", "fall"),
}


@dataclass
class OutlineSchedule:
    """Schedule entry from course outline."""

    days: str = ""
    start_time: str = ""
    end_time: str = ""
    campus: str = ""
    start_date: str = ""
    end_date: str = ""


@dataclass
class OutlineData:
    """Parsed course outline data from SFU API."""

    # Core info
    description: str = ""
    prerequisites: str = ""
    corequisites: str = ""
    designation: str = ""  # WQB designation
    delivery_method: str = ""
    units: str = ""
    degree_level: str = ""  # UGRD or GRAD

    # Instructor
    instructor_name: str = ""
    instructor_email: str = ""

    # Schedule
    schedule: list[OutlineSchedule] = field(default_factory=list)


async def fetch_course_outline(
    year: str,
    term: str,
    dept: str,
    number: str,
    section: str,
    timeout: float = 10.0,
) -> OutlineData | None:
    """
    Fetch detailed course outline from SFU API.

    Args:
        year: e.g., "2026"
        term: e.g., "summer"
        dept: e.g., "cmpt" (lowercase)
        number: e.g., "120"
        section: e.g., "d100" (lowercase)
        timeout: Request timeout in seconds

    Returns:
        OutlineData if found, None if 404 or error
    """
    url = f"{SFU_OUTLINES_BASE}?{year}/{term}/{dept.lower()}/{number}/{section.lower()}"

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.get(url)

            if response.status_code == 404:
                return None

            response.raise_for_status()
            data = response.json()

            return _parse_outline(data)

        except httpx.HTTPStatusError:
            return None
        except httpx.RequestError:
            return None
        except Exception:
            return None


def _parse_outline(data: dict) -> OutlineData:
    """Parse raw API response into OutlineData."""
    info = data.get("info", {})

    # Parse instructor (take first one if multiple)
    instructors = data.get("instructor", [])
    instructor_name = ""
    instructor_email = ""
    if instructors:
        first = instructors[0]
        instructor_name = first.get("name", "") or first.get("commonName", "")
        instructor_email = first.get("email", "")

    # Parse schedule
    schedule_list: list[OutlineSchedule] = []
    for sched in data.get("courseSchedule", []):
        if sched.get("isExam"):
            continue  # Skip exam entries

        schedule_list.append(
            OutlineSchedule(
                days=sched.get("days", ""),
                start_time=sched.get("startTime", ""),
                end_time=sched.get("endTime", ""),
                campus=sched.get("campus", ""),
                start_date=sched.get("startDate", ""),
                end_date=sched.get("endDate", ""),
            )
        )

    return OutlineData(
        description=_clean_text(info.get("description", "")),
        prerequisites=_clean_text(info.get("prerequisites", "")),
        corequisites=_clean_text(info.get("corequisites", "")),
        designation=info.get("designation", ""),
        delivery_method=info.get("deliveryMethod", ""),
        units=info.get("units", ""),
        degree_level=info.get("degreeLevel", ""),
        instructor_name=instructor_name,
        instructor_email=instructor_email,
        schedule=schedule_list,
    )


def _clean_text(text: str) -> str:
    """Clean HTML and normalize whitespace."""
    import re

    if not text:
        return ""

    # Remove HTML tags
    clean = re.sub(r"<[^>]+>", "", str(text))
    # Decode common HTML entities
    clean = clean.replace("&amp;", "&")
    clean = clean.replace("&lt;", "<")
    clean = clean.replace("&gt;", ">")
    clean = clean.replace("&quot;", '"')
    clean = clean.replace("&#39;", "'")
    clean = clean.replace("&nbsp;", " ")
    # Normalize whitespace
    clean = " ".join(clean.split())
    return clean.strip()


def get_term_from_semester(semester: str) -> tuple[str, str]:
    """
    Convert semester code to year and term.

    Args:
        semester: e.g., "1264"

    Returns:
        (year, term) e.g., ("2026", "summer")
    """
    if semester in SEMESTER_TO_TERM:
        return SEMESTER_TO_TERM[semester]

    # Parse semester code: 1XYZ where X=last digit of year, YZ=term
    # 1 = Spring, 4 = Summer, 7 = Fall
    code = semester
    if len(code) == 4 and code.startswith("1"):
        year_digit = code[1:3]
        term_code = code[3]

        year = f"20{year_digit}"
        term_map = {"1": "spring", "4": "summer", "7": "fall"}
        term = term_map.get(term_code, "summer")

        return year, term

    # Default fallback
    return "2026", "summer"
