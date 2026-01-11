package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Response DTO from the RAG service /api/recommend endpoint.
 */
public class RagResponse {

    private boolean success;

    @JsonProperty("query_interpretation")
    private String queryInterpretation;

    private List<CourseResult> courses;

    private String error;

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getQueryInterpretation() {
        return queryInterpretation;
    }

    public void setQueryInterpretation(String queryInterpretation) {
        this.queryInterpretation = queryInterpretation;
    }

    public List<CourseResult> getCourses() {
        return courses;
    }

    public void setCourses(List<CourseResult> courses) {
        this.courses = courses;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    /**
     * Nested class for individual course results.
     */
    public static class CourseResult {

        @JsonProperty("course_code")
        private String courseCode;

        private String title;
        private String description;
        private List<String> campus;
        private List<String> wqb;
        private int units;
        private String prerequisites;

        @JsonProperty("has_prerequisites")
        private boolean hasPrerequisites;

        private String instructor;

        @JsonProperty("delivery_methods")
        private List<String> deliveryMethods;

        @JsonProperty("relevance_score")
        private double relevanceScore;

        @JsonProperty("match_reason")
        private String matchReason;

        // Getters and Setters
        public String getCourseCode() {
            return courseCode;
        }

        public void setCourseCode(String courseCode) {
            this.courseCode = courseCode;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public List<String> getCampus() {
            return campus;
        }

        public void setCampus(List<String> campus) {
            this.campus = campus;
        }

        public List<String> getWqb() {
            return wqb;
        }

        public void setWqb(List<String> wqb) {
            this.wqb = wqb;
        }

        public int getUnits() {
            return units;
        }

        public void setUnits(int units) {
            this.units = units;
        }

        public String getPrerequisites() {
            return prerequisites;
        }

        public void setPrerequisites(String prerequisites) {
            this.prerequisites = prerequisites;
        }

        public boolean isHasPrerequisites() {
            return hasPrerequisites;
        }

        public void setHasPrerequisites(boolean hasPrerequisites) {
            this.hasPrerequisites = hasPrerequisites;
        }

        public String getInstructor() {
            return instructor;
        }

        public void setInstructor(String instructor) {
            this.instructor = instructor;
        }

        public List<String> getDeliveryMethods() {
            return deliveryMethods;
        }

        public void setDeliveryMethods(List<String> deliveryMethods) {
            this.deliveryMethods = deliveryMethods;
        }

        public double getRelevanceScore() {
            return relevanceScore;
        }

        public void setRelevanceScore(double relevanceScore) {
            this.relevanceScore = relevanceScore;
        }

        public String getMatchReason() {
            return matchReason;
        }

        public void setMatchReason(String matchReason) {
            this.matchReason = matchReason;
        }

        /**
         * Formats this course as a readable string for response.
         */
        public String toFormattedString() {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("**%s - %s**\n", courseCode, title));

            if (description != null && !description.isEmpty()) {
                String truncatedDesc = description.length() > 200
                        ? description.substring(0, 200) + "..."
                        : description;
                sb.append(truncatedDesc).append("\n\n");
            }

            sb.append(String.format("• Campus: %s\n", String.join(", ", campus)));
            sb.append(String.format("• Units: %d\n", units));

            if (wqb != null && !wqb.isEmpty()) {
                sb.append(String.format("• WQB: %s\n", String.join(", ", wqb)));
            }

            if (hasPrerequisites && prerequisites != null && !prerequisites.isEmpty()) {
                sb.append(String.format("• Prerequisites: %s\n", prerequisites));
            } else {
                sb.append("• Prerequisites: None\n");
            }

            if (matchReason != null && !matchReason.isEmpty()) {
                sb.append(String.format("\n_%s_", matchReason));
            }

            return sb.toString();
        }
    }
}
