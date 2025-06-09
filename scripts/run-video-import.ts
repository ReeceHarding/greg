// Simple script to trigger video import
async function runVideoImport() {
  console.log("Triggering video import via API...")
  
  try {
    const response = await fetch('http://localhost:3005/api/youtube/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'import'
      })
    })
    
    const data = await response.json()
    console.log("Import result:", data)
  } catch (error) {
    console.error("Error triggering import:", error)
  }
}

runVideoImport() 