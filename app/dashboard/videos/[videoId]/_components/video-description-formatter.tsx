"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp, Clock, Hash, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoDescriptionFormatterProps {
  description: string
  onTimestampClick?: (seconds: number) => void
}

export default function VideoDescriptionFormatter({ 
  description, 
  onTimestampClick 
}: VideoDescriptionFormatterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Parse timestamps (e.g., "1:23:45" or "23:45")
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':').map(p => parseInt(p))
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    return 0
  }
  
  // Format description with enhanced styling
  const formatDescription = (text: string) => {
    if (!text) return null
    
    // Split into lines for processing
    const lines = text.split('\n')
    const processedLines: React.JSX.Element[] = []
    
    lines.forEach((line, index) => {
      // Skip empty lines
      if (!line.trim()) {
        processedLines.push(<div key={index} className="h-4" />)
        return
      }
      
      // Check for timestamps section header
      if (line.toLowerCase().includes('timestamps:') || line.toLowerCase().includes('timeline:')) {
        processedLines.push(
          <h3 key={index} className="font-semibold text-lg mt-6 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {line}
          </h3>
        )
        return
      }
      
      // Check for key points header
      if (line.toLowerCase().includes('key points:') || line.toLowerCase().includes('key takeaways:')) {
        processedLines.push(
          <h3 key={index} className="font-semibold text-lg mt-6 mb-3 flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            {line}
          </h3>
        )
        return
      }
      
      // Check for section headers (lines ending with :)
      if (line.trim().endsWith(':') && !line.includes('http')) {
        processedLines.push(
          <h3 key={index} className="font-semibold text-base mt-4 mb-2 text-foreground">
            {line}
          </h3>
        )
        return
      }
      
      // Process the line content
      let processedLine = line
      
      // Replace bullet points with better formatting
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        processedLine = line.replace(/^[\s•-]+/, '')
        processedLines.push(
          <div key={index} className="flex gap-2 mb-2">
            <span className="text-primary mt-1">•</span>
            <span className="flex-1">{formatLineContent(processedLine)}</span>
          </div>
        )
        return
      }
      
      // Regular paragraph
      processedLines.push(
        <p key={index} className="mb-2 leading-relaxed">
          {formatLineContent(line)}
        </p>
      )
    })
    
    return processedLines
  }
  
  // Format individual line content (timestamps, links, etc)
  const formatLineContent = (text: string): React.ReactElement[] => {
    const elements: React.ReactElement[] = []
    
    // Regex patterns
    const timestampRegex = /(\d{1,2}:\d{2}(?::\d{2})?)/g
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const quotesRegex = /"([^"]+)"/g
    
    // Split by timestamps and URLs
    let lastIndex = 0
    const allMatches: Array<{match: string, index: number, type: 'timestamp' | 'url' | 'quote'}> = []
    
    // Find all timestamps
    let match
    while ((match = timestampRegex.exec(text)) !== null) {
      allMatches.push({ match: match[0], index: match.index, type: 'timestamp' })
    }
    
    // Find all URLs
    while ((match = urlRegex.exec(text)) !== null) {
      allMatches.push({ match: match[0], index: match.index, type: 'url' })
    }
    
    // Sort matches by index
    allMatches.sort((a, b) => a.index - b.index)
    
    // Process matches
    allMatches.forEach((matchInfo, i) => {
      // Add text before match
      if (matchInfo.index > lastIndex) {
        const beforeText = text.substring(lastIndex, matchInfo.index)
        elements.push(
          <span key={`text-${i}`} className="text-muted-foreground">
            {formatTextWithHighlights(beforeText)}
          </span>
        )
      }
      
      // Add the match
      if (matchInfo.type === 'timestamp' && onTimestampClick) {
        const seconds = parseTimestamp(matchInfo.match)
        elements.push(
          <button
            key={`timestamp-${i}`}
            onClick={() => onTimestampClick(seconds)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors"
          >
            <Clock className="w-3 h-3" />
            {matchInfo.match}
          </button>
        )
      } else if (matchInfo.type === 'url') {
        elements.push(
          <a
            key={`url-${i}`}
            href={matchInfo.match}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <LinkIcon className="w-3 h-3" />
            <span className="text-sm">Link</span>
          </a>
        )
      }
      
      lastIndex = matchInfo.index + matchInfo.match.length
    })
    
    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-final" className="text-muted-foreground">
          {formatTextWithHighlights(text.substring(lastIndex))}
        </span>
      )
    }
    
    return elements.length > 0 ? elements : [<span key="text">{text}</span>]
  }
  
  // Format text with highlights for important terms
  const formatTextWithHighlights = (text: string): React.ReactElement => {
    // Highlight quoted text
    const parts = text.split(/"([^"]+)"/)
    
    return (
      <>
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            // This is quoted text
            return (
              <span key={i} className="font-medium text-foreground">
                "{part}"
              </span>
            )
          }
          
          // Check for numbers with specific patterns (e.g., "3X", "$100K", "2 weeks")
          const formattedPart = part.replace(
            /(\d+[KMB]?X?|\$\d+[KMB]?|\d+\s*(?:weeks?|days?|hours?|minutes?))/gi,
            (match) => {
              return `<span class="font-semibold text-primary">${match}</span>`
            }
          )
          
          return (
            <span 
              key={i} 
              dangerouslySetInnerHTML={{ __html: formattedPart }}
            />
          )
        })}
      </>
    )
  }
  
  const formattedContent = formatDescription(description)
  const shouldShowToggle = description && description.length > 500
  
  return (
    <div className="space-y-4">
      <div className={`${!isExpanded && shouldShowToggle ? 'max-h-[300px] overflow-hidden relative' : ''}`}>
        <div className="text-[15px] leading-[1.8] space-y-2">
          {formattedContent}
        </div>
        
        {!isExpanded && shouldShowToggle && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      
      {shouldShowToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-center gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show More
            </>
          )}
        </Button>
      )}
    </div>
  )
} 