# Query Reference Guide

## Overview

The recommendation API accepts natural language queries with optional filters and returns ranked course matches.

---

## Request Structure

```json
{
  "query": "string (required)",
  "filters": { },
  "top_k": 5,
  "min_relevance": 0.30
}
```

| Field | Type | Default | Constraints |
|-------|------|---------|-------------|
| query | string | required | 3-500 chars |
| filters | object | {} | See below |
| top_k | int | 5 | 1-10 |
| min_relevance | float | 0.30 | 0.0-1.0 |

---

## Available Filters

| Filter | Type | Values |
|--------|------|--------|
| campus | list | `Burnaby`, `Surrey`, `Vancouver`, `Online` |
| wqb | list | `W`, `Q`, `B-Sci`, `B-Soc`, `B-Hum` |
| max_level | int | `100`, `200`, `300` |
| no_prerequisites | bool | `true`, `false` |
| exclude_departments | list | Any dept code (e.g., `CMPT`, `MACM`) |

**WQB Codes:**
- **W** - Writing Intensive
- **Q** - Quantitative
- **B-Sci** - Breadth-Science
- **B-Soc** - Breadth-Social Sciences
- **B-Hum** - Breadth-Humanities

---

## Response Structure

```json
{
  "success": true,
  "query_interpretation": "string",
  "courses": [ CourseResult ]
}
```

---

## Full Course Object

```json
{
  "course_code": "PHIL 100W",
  "title": "Introduction to Philosophy",
  "description": "An introduction to basic philosophical questions...",
  "campus": ["Burnaby", "Vancouver"],
  "wqb": ["W", "B-Hum"],
  "units": 3,
  "prerequisites": "",
  "has_prerequisites": false,
  "instructor": "Dr. Wilson",
  "delivery_methods": ["In Person", "Online"],
  "relevance_score": 0.454,
  "match_reason": "This course matches your interest in humanities..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| course_code | string | Department + number |
| title | string | Course title |
| description | string | Full description |
| campus | list | Campuses offered |
| wqb | list | WQB designations |
| units | int | Credit units |
| prerequisites | string | Prerequisite text |
| has_prerequisites | bool | Has prereqs flag |
| instructor | string | Instructor name |
| delivery_methods | list | Delivery format |
| relevance_score | float | Similarity score (0-1) |
| match_reason | string | LLM explanation |

---

## Example Requests

### Basic Query
```json
{
  "query": "learn about climate change"
}
```

### With Filters
```json
{
  "query": "easy breadth course",
  "filters": {
    "wqb": ["B-Soc", "B-Hum"],
    "no_prerequisites": true,
    "max_level": 200
  },
  "top_k": 5
}
```

### Excluding Departments
```json
{
  "query": "introductory course",
  "filters": {
    "exclude_departments": ["CMPT", "MACM"],
    "campus": ["Burnaby"]
  }
}
```

---

## Sample Response

```json
{
  "success": true,
  "query_interpretation": "Looking for an easy course that fulfills breadth requirements",
  "courses": [
    {
      "course_code": "REM 100",
      "title": "Global Change and Sustainability",
      "description": "An interdisciplinary approach to resource management...",
      "campus": ["Burnaby"],
      "wqb": ["B-Soc"],
      "units": 3,
      "prerequisites": "",
      "has_prerequisites": false,
      "instructor": "Dr. Smith",
      "delivery_methods": ["In Person"],
      "relevance_score": 0.556,
      "match_reason": "This course offers an interdisciplinary perspective on environmental sustainability."
    },
    {
      "course_code": "PSYC 100",
      "title": "Introduction to Psychology",
      "description": "An introduction to the major areas of psychology...",
      "campus": ["Burnaby"],
      "wqb": ["B-Soc"],
      "units": 3,
      "prerequisites": "",
      "has_prerequisites": false,
      "instructor": "Dr. Jones",
      "delivery_methods": ["In Person"],
      "relevance_score": 0.482,
      "match_reason": "A popular intro course with no prerequisites that satisfies B-Soc."
    }
  ]
}
```

---

## Error Response

```json
{
  "success": false,
  "error": "No courses match your interests with the given filters."
}
```
