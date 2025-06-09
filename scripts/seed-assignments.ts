import { createAssignmentAction } from "@/actions/db/assignments-actions"
import { Timestamp } from "firebase-admin/firestore"

// AI Summer Camp Assignment Data - 8 Weeks
const assignments = [
  // Week 1: Business Foundations & AI Mindset
  {
    weekNumber: 1,
    dayNumber: null,
    title: "Launch Your AI Business Foundation",
    description: `Create the foundation for your AI-powered business by establishing your digital presence and setting up essential tools.

This week focuses on:
- Setting up your business domain and website
- Creating your business identity and brand
- Establishing your digital workspace
- Understanding the AI entrepreneur mindset`,
    requirements: {
      videoDemo: true,
      githubRepo: false,
      reflection: true,
      supportingDocs: true
    },
    theme: "Business Foundations & AI Mindset",
    order: 1
  },
  
  // Week 2: Ideation & Market Research
  {
    weekNumber: 2,
    dayNumber: null,
    title: "AI Business Idea Validation",
    description: `Research and validate your AI business idea using modern tools and frameworks.

This week focuses on:
- Market research using AI tools
- Competitor analysis
- Creating your unique value proposition
- Building a business model canvas`,
    requirements: {
      videoDemo: true,
      githubRepo: false,
      reflection: true,
      supportingDocs: true
    },
    theme: "Ideation & Market Research",
    order: 2
  },
  
  // Week 3: Product Design & Prototyping
  {
    weekNumber: 3,
    dayNumber: null,
    title: "Design Your AI Product Prototype",
    description: `Create a working prototype of your AI product or service using no-code and AI tools.

This week focuses on:
- User experience design principles
- Creating mockups and wireframes
- Building a functional prototype
- Getting early user feedback`,
    requirements: {
      videoDemo: true,
      githubRepo: true,
      reflection: true,
      supportingDocs: true
    },
    theme: "Product Design & Prototyping",
    order: 3
  },
  
  // Week 4: Content Creation & Marketing
  {
    weekNumber: 4,
    dayNumber: null,
    title: "Build Your Content Marketing Engine",
    description: `Develop a content marketing strategy and create your first pieces of AI-generated content.

This week focuses on:
- Content strategy development
- AI-powered content creation
- Social media marketing
- Building an email list`,
    requirements: {
      videoDemo: true,
      githubRepo: false,
      reflection: true,
      supportingDocs: true
    },
    theme: "Content Creation & Marketing",
    order: 4
  },
  
  // Week 5: Sales & Customer Acquisition
  {
    weekNumber: 5,
    dayNumber: null,
    title: "Launch Your First Sales Campaign",
    description: `Create and execute your first customer acquisition campaign using AI-powered sales tools.

This week focuses on:
- Sales funnel creation
- Lead generation strategies
- AI-powered outreach
- Converting prospects to customers`,
    requirements: {
      videoDemo: true,
      githubRepo: false,
      reflection: true,
      supportingDocs: true
    },
    theme: "Sales & Customer Acquisition",
    order: 5
  },
  
  // Week 6: Operations & Automation
  {
    weekNumber: 6,
    dayNumber: null,
    title: "Automate Your Business Operations",
    description: `Build automated workflows to scale your business operations efficiently.

This week focuses on:
- Process automation with n8n
- Customer service automation
- Data collection and analysis
- Building scalable systems`,
    requirements: {
      videoDemo: true,
      githubRepo: true,
      reflection: true,
      supportingDocs: true
    },
    theme: "Operations & Automation",
    order: 6
  },
  
  // Week 7: Growth & Scaling
  {
    weekNumber: 7,
    dayNumber: null,
    title: "Scale Your AI Business",
    description: `Implement growth strategies to scale your business to the next level.

This week focuses on:
- Growth hacking techniques
- Partnership strategies
- Scaling customer acquisition
- Building recurring revenue`,
    requirements: {
      videoDemo: true,
      githubRepo: false,
      reflection: true,
      supportingDocs: true
    },
    theme: "Growth & Scaling",
    order: 7
  },
  
  // Week 8: Final Project & Presentation
  {
    weekNumber: 8,
    dayNumber: null,
    title: "Final Business Presentation",
    description: `Present your complete AI business with demonstrated traction and future growth plans.

This week focuses on:
- Creating a comprehensive business presentation
- Demonstrating real customer traction
- Showing revenue or growth metrics
- Planning next steps for your business`,
    requirements: {
      videoDemo: true,
      githubRepo: true,
      reflection: true,
      supportingDocs: true
    },
    theme: "Final Project & Presentation",
    order: 8
  }
]

// Function to calculate due date based on week number
function calculateDueDate(weekNumber: number): Date {
  const startDate = new Date() // Program starts today
  const daysUntilDue = (weekNumber * 7) - 1 // Due at the end of each week
  const dueDate = new Date(startDate)
  dueDate.setDate(startDate.getDate() + daysUntilDue)
  dueDate.setHours(23, 59, 59, 999) // Set to end of day
  return dueDate
}

// Main seed function
export async function seedAssignments() {
  console.log("[Seed Assignments] Starting assignment seeding...")
  
  let successCount = 0
  let errorCount = 0
  
  for (const assignment of assignments) {
    try {
      console.log(`[Seed Assignments] Creating assignment: ${assignment.title}`)
      
      const dueDate = calculateDueDate(assignment.weekNumber)
      
      const result = await createAssignmentAction({
        ...assignment,
        dueDate: Timestamp.fromDate(dueDate) as any
      })
      
      if (result.isSuccess) {
        console.log(`[Seed Assignments] ✓ Created: ${assignment.title}`)
        successCount++
      } else {
        console.error(`[Seed Assignments] ✗ Failed to create ${assignment.title}: ${result.message}`)
        errorCount++
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error(`[Seed Assignments] Error creating assignment ${assignment.title}:`, error)
      errorCount++
    }
  }
  
  console.log("[Seed Assignments] Seeding complete!")
  console.log(`[Seed Assignments] Success: ${successCount}, Errors: ${errorCount}`)
  
  return { successCount, errorCount }
}

// Run the seed function if called directly
if (require.main === module) {
  seedAssignments().catch((error) => {
    console.error("[Seed Assignments] Fatal error:", error)
    process.exit(1)
  })
} 