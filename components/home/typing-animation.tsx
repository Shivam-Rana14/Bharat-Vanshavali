"use client"

import { useState, useEffect } from "react"

interface TypingAnimationProps {
  texts: string[]
  speed?: number
}

export function TypingAnimation({ texts, speed = 150 }: TypingAnimationProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fullText = texts[currentTextIndex]
      
      if (isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length - 1))
      } else {
        setCurrentText(fullText.substring(0, currentText.length + 1))
      }

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false)
        setCurrentTextIndex((prev) => (prev + 1) % texts.length)
      }
    }, isDeleting ? speed / 2 : speed)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentTextIndex, texts, speed])

  return (
    <span className="inline-block min-w-[200px] text-left">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-green-600">
        {currentText}
      </span>
      <span className="animate-pulse text-orange-500">|</span>
    </span>
  )
} 