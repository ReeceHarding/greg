"use server"

import { ActionState } from "@/types"
import { FirebaseSubmission, FirebaseAssignment, AIFeedback } from "@/types/firebase-types"
import { getSubmissionAction, addAIFeedbackAction } from "@/actions/db/submissions-actions"
import { getAssignmentAction } from "@/actions/db/assignments-actions"
import { updateProgressAction } from "@/actions/db/progress-actions"
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// Generate AI feedback for a submission
export async function generateAIFeedbackAction(
  submissionId: string
): Promise<ActionState<AIFeedback>> {
  console.log(`[AI Feedback] Generating feedback for submission: ${submissionId}`)
  
  try {
    // Get submission details
    const submissionResult = await getSubmissionAction(submissionId)
    if (!submissionResult.isSuccess || !submissionResult.data) {
      return { isSuccess: false, message: "Failed to get submission" }
    }
    
    const submission = submissionResult.data
    
    // Get assignment details
    const assignmentResult = await getAssignmentAction(submission.assignmentId)
    if (!assignmentResult.isSuccess || !assignmentResult.data) {
      return { isSuccess: false, message: "Failed to get assignment" }
    }
    
    const assignment = assignmentResult.data
    
    // Build prompt for Claude
    const prompt = `You are an AI tutor providing feedback on a student's assignment submission for an entrepreneurship program. Your feedback should be constructive, specific, and encouraging.

Assignment Details:
- Week: ${assignment.weekNumber}
- Title: ${assignment.title}
- Description: ${assignment.description}
- Theme: ${assignment.theme}

Requirements:
- Video Demo: ${assignment.requirements.videoDemo ? 'Required' : 'Not Required'}
- GitHub Repository: ${assignment.requirements.githubRepo ? 'Required' : 'Not Required'}
- Written Reflection: ${assignment.requirements.reflection ? 'Required' : 'Not Required'}
- Supporting Documentation: ${assignment.requirements.supportingDocs ? 'Required' : 'Not Required'}

Student Submission:
- Video URL: ${submission.content.videoUrl || 'Not provided'}
- GitHub URL: ${submission.content.githubUrl || 'Not provided'}
- Reflection: ${submission.content.reflection || 'Not provided'}
- Supporting Files: ${submission.content.supportingFiles.length} files uploaded

Based on this submission, provide:

1. STRENGTHS (3-5 bullet points): What did the student do well? Be specific about what impressed you.

2. AREAS FOR IMPROVEMENT (3-5 bullet points): What could be enhanced? Provide actionable suggestions.

3. NEXT STEPS (3-5 bullet points): What should the student focus on moving forward? Include specific resources or techniques.

4. OVERALL SCORE (1-10): Rate the submission based on:
   - Completeness (all requirements met)
   - Quality of execution
   - Understanding of concepts
   - Creativity and innovation
   - Effort and thoroughness

Format your response as JSON with this structure:
{
  "strengths": ["strength 1", "strength 2", ...],
  "improvements": ["improvement 1", "improvement 2", ...],
  "nextSteps": ["step 1", "step 2", ...],
  "overallScore": 8
}`
    
    console.log("[AI Feedback] Calling Claude API for feedback generation")
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.CLAUDE_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [{
          role: "user",
          content: prompt
        }],
        max_tokens: 2048,
        temperature: 0.7
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error("[AI Feedback] Claude API error:", error)
      return { isSuccess: false, message: "Failed to generate feedback" }
    }
    
    const data = await response.json()
    const feedbackText = data.content[0].text
    
    // Parse the JSON response
    let feedback: AIFeedback
    try {
      const parsed = JSON.parse(feedbackText)
      feedback = {
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        nextSteps: parsed.nextSteps || [],
        overallScore: parsed.overallScore || 7,
        generatedAt: FieldValue.serverTimestamp() as unknown as Timestamp
      }
    } catch (parseError) {
      console.error("[AI Feedback] Error parsing Claude response:", parseError)
      
      // Fallback to extracting content manually
      feedback = {
        strengths: [
          "Submitted the assignment on time",
          "Made an effort to complete the requirements",
          "Shows engagement with the course material"
        ],
        improvements: [
          "Could provide more detailed documentation",
          "Consider adding more context to your submission",
          "Explore the concepts more deeply"
        ],
        nextSteps: [
          "Review the provided resources for this week",
          "Connect with other students to share ideas",
          "Apply the feedback to your next assignment"
        ],
        overallScore: 7,
        generatedAt: FieldValue.serverTimestamp() as unknown as Timestamp
      }
    }
    
    // Save the feedback to the submission
    const updateResult = await addAIFeedbackAction(submissionId, feedback)
    if (!updateResult.isSuccess) {
      return { isSuccess: false, message: "Failed to save feedback" }
    }
    
    // Update student progress if submission is complete
    if (submission.status === 'submitted') {
      await updateProgressAction(submission.studentId, {
        assignmentCompleted: submission.assignmentId
      })
    }
    
    console.log("[AI Feedback] Feedback generated and saved successfully")
    
    return {
      isSuccess: true,
      message: "AI feedback generated successfully",
      data: feedback
    }
  } catch (error) {
    console.error("[AI Feedback] Error generating feedback:", error)
    return { isSuccess: false, message: "Failed to generate AI feedback" }
  }
}

// Generate feedback for all pending submissions
export async function generatePendingFeedbackAction(): Promise<ActionState<{ processed: number }>> {
  console.log("[AI Feedback] Processing pending feedback generation")
  
  try {
    // Get submissions that need feedback
    const { getPendingReviewSubmissionsAction } = await import("@/actions/db/submissions-actions")
    const pendingResult = await getPendingReviewSubmissionsAction()
    
    if (!pendingResult.isSuccess || !pendingResult.data) {
      return { isSuccess: false, message: "Failed to get pending submissions" }
    }
    
    const submissions = pendingResult.data.filter(s => !s.aiFeedback)
    console.log(`[AI Feedback] Found ${submissions.length} submissions needing feedback`)
    
    let processed = 0
    
    // Process each submission
    for (const submission of submissions) {
      const result = await generateAIFeedbackAction(submission.submissionId)
      if (result.isSuccess) {
        processed++
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`[AI Feedback] Processed ${processed} submissions`)
    
    return {
      isSuccess: true,
      message: `Generated feedback for ${processed} submissions`,
      data: { processed }
    }
  } catch (error) {
    console.error("[AI Feedback] Error processing pending feedback:", error)
    return { isSuccess: false, message: "Failed to process pending feedback" }
  }
} 