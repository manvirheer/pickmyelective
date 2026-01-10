# RAG Query Examples

Real query results demonstrating the recommendation engine's capabilities across different use cases.

---

## 1. Topic-Based Queries

### Environment & Climate Change
**Query:** `"learn about climate change and environment"`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| REM 100 - Global Change | 0.556 | B-Soc | Interdisciplinary perspective on environmental footprint and sustainable future |
| GEOG 104 - Climate Change, Water, Society | 0.555 | B-Soc | Examines climate-water interaction and human adaptation |
| SD 100 - Sustainable Futures | 0.512 | - | Practical tools for sustainability and positive change |

**Rationale:** High relevance scores (0.51-0.56) show strong semantic match. All three courses directly address environmental topics from different angles.

---

### History & Ancient Civilizations
**Query:** `"history and ancient civilizations"`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| ARCH 100 - Anc. People/Places | 0.576 | B-Soc | Survey from Palaeolithic to rise of empires |
| ARCH 252 - Ancient Egypt and Africa | 0.556 | B-Hum | African civilizations with emphasis on Egypt |
| ARCH 101 - Reconstructing the Human Past | 0.528 | B-Soc | Archaeological methods for interpreting the past |

**Rationale:** Highest scores in this test set. ARCH department courses dominate as expected for ancient history queries.

---

### Business & Entrepreneurship
**Query:** `"business and entrepreneurship"`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| BUS 200 - Business Fundamentals | 0.496 | B-Soc | Revenue, profits, business models, strategic analysis |
| BUS 238 - Entrepreneurship & Innovation | 0.490 | B-Soc | Hands-on innovation through interdisciplinary teamwork |
| BUS 240 - Introduction to Innovation | 0.434 | - | Innovation concepts in organizations and startups |

**Rationale:** All BUS courses, demonstrating strong department relevance. BUS 238 directly matches "entrepreneurship" keyword.

---

### Film & Cinema
**Query:** `"film movies cinema"`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| CA 135 - Introduction to Cinema | 0.556 | B-Hum | Techniques, styles, forms - cinematography, editing, sound |
| HUM 333W - Italian Films, Italian Hum. | 0.469 | W, B-Hum | Modern Italy through film medium |
| CA 386 - Film Music | 0.447 | - | Role of music in viewer's film experience |

**Rationale:** CA (Contemporary Arts) and HUM courses dominate. Highest score for intro cinema course shows good entry-point recommendation.

---

## 2. Filter-Based Queries

### CS Student Seeking Humanities (B-Hum filter)
**Query:** `"interesting course for computer science student"`
**Filter:** `wqb: ["B-Hum"]`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| HIST 111 - Histories of Technology | 0.366 | B-Hum | Social/cultural context of technology development |
| IAT 244 - Digi, Virtual & AI Photography | 0.329 | B-Hum | Generative AI platforms, virtual image production |

**Rationale:** Lower scores because query is vague, but filter ensures B-Hum requirement. HIST 111 bridges tech/humanities gap effectively.

---

### Quantitative Courses (Q filter)
**Query:** `"math and statistics"`
**Filter:** `wqb: ["Q"]`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| STAT 270 - Probability and Statistics | 0.501 | Q | Laws of probability, statistical inference |
| PSYC 210 - Introduction to Data Analysis | 0.435 | Q | Descriptive and inferential techniques |
| STAT 201 - Statistics for Life Sciences | 0.421 | Q | Statistical analysis for life science research |

**Rationale:** All Q-designated courses with strong statistical focus. Cross-department results (STAT, PSYC) show semantic understanding.

---

### Philosophy with Humanities (B-Hum filter)
**Query:** `"philosophy and ethics"`
**Filter:** `wqb: ["B-Hum"]`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| PHIL 120W - Moral and Legal Problems | 0.500 | W, B-Hum | Moral dilemmas: law, rights, duties |
| PHIL 100W - Knowledge and Reality | 0.449 | W, B-Hum | Reality, knowledge, truth, free will |
| EDUC 230 - Intro. Philosophy of Education | 0.409 | B-Hum | Educational problems from philosophical perspective |

**Rationale:** PHIL courses rank highest. Interesting that EDUC 230 appears - shows semantic understanding of "philosophy" beyond department.

---

### Writing Intensive (W filter)
**Query:** `"writing intensive essay course"`
**Filter:** `wqb: ["W"]`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| ENGL 199W - Writing to Persuade | 0.456 | W | Rhetorical reading and writing skills |
| IAT 309W - Writing Methods for Research | 0.447 | W | Critical thinking and writing strategies |
| ENGL 114W - Language and Purpose | 0.437 | W, B-Hum | Writing skills across genres (essays, journalism) |

**Rationale:** All W-designated courses focused on writing development. Good variety across ENGL and IAT departments.

---

## 3. Beginner-Friendly Queries

### No Prerequisites + 100-Level
**Query:** `"beginner friendly course"`
**Filters:** `no_prerequisites: true`, `max_level: 100`

| Course | Score | WQB | Prereqs | Why It Matches |
|--------|-------|-----|---------|----------------|
| CMPT 120 - Intro Programming I | 0.347 | Q, B-Sci | None | For students with little/no programming background |
| SPAN 100 - Introductory Spanish I | 0.335 | B-Hum | None | For students with little/no Spanish background |
| FREN 101 - Elementary French I | 0.321 | B-Hum | None | Interactive intro to French language/culture |

**Rationale:** All courses explicitly designed for beginners with no prerequisites. Multi-department results show semantic understanding.

---

## 4. Slang & Colloquial Queries

### "Bird Course" (Easy A)
**Query:** `"bird course easy A"`

| Course | Score | WQB | Prereqs | Why It Matches |
|--------|-------|-----|---------|----------------|
| BISC 113 - Biology in Everyday Life | 0.405 | B-Sci | None | Accessible biology topics, practical applications |
| FREN 101 - Elementary French I | 0.393 | B-Hum | None | Interactive, media-rich, foundational |
| SPAN 100 - Introductory Spanish I | 0.381 | B-Hum | None | Basic conversational skills, manageable workload |

**Rationale:** Engine interprets "bird course" as "easy, beginner-friendly, likely high grade" and returns accessible intro courses.

---

## 5. Specialized Topics

### Language Learning
**Query:** `"learn a new language"`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| LING 100 - Cmns & Language | 0.486 | B-Soc | How humans acquire language, cognitive processes |
| INLG 333 - INLG Intermed Proficiency I | 0.418 | - | Indigenous language fluency building |
| LING 350 - First Language Acquisition | 0.409 | - | Language acquisition from linguistic structure |

**Rationale:** Mix of practical language courses and theoretical linguistics. Shows understanding of both "learning" and "language" concepts.

---

### Food & Nutrition
**Query:** `"courses about food nutrition diet"`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| BPK 110 - Human Nutrition | 0.453 | B-Sci | Nutrition principles, food selection, health |
| BPK 140 - Contemporary Health | 0.374 | B-Sci | Diet, exercise, holistic health perspective |
| EDUC 371W - School Health Education | 0.317 | W | Health behaviors including nutrition in schools |

**Rationale:** BPK (Biomedical Physiology & Kinesiology) courses dominate for health/nutrition topics.

---

### Social Issues & Politics
**Query:** `"social issues and politics"`

| Course | Score | WQB | Why It Matches |
|--------|-------|-----|----------------|
| EDUC 240 - Social Issues | 0.433 | - | Social, political, economic influences on education |
| SA 150 - Intro to Sociology | 0.404 | B-Soc | Sociological perspective on social processes |
| POL 222 - Introduction Canadian Politics | 0.396 | - | Political culture, parties, elections, movements |

**Rationale:** Cross-department results (EDUC, SA, POL) show semantic understanding of "social" and "politics" concepts.

---

## 6. Edge Cases

### Strict Filter - No Results
**Query:** `"social issues and politics"`
**Filter:** `campus: ["Surrey"]`

**Result:** No matches found.

**Rationale:** Surrey campus has limited course offerings. The social/politics courses are primarily at Burnaby. System correctly returns no results rather than irrelevant matches.

---

## Summary Statistics

| Query Type | Avg Score | Score Range |
|------------|-----------|-------------|
| Topic-based (no filter) | 0.47 | 0.32 - 0.58 |
| With WQB filter | 0.42 | 0.33 - 0.50 |
| With multiple filters | 0.33 | 0.32 - 0.35 |
| Slang/colloquial | 0.39 | 0.38 - 0.41 |

**Observations:**
1. Topic queries without filters yield highest relevance scores
2. Filters reduce scores but ensure requirement compliance
3. Engine handles slang ("bird course") through semantic interpretation
4. Cross-department results demonstrate understanding beyond keywords
5. Strict filters correctly return empty when no matches exist
