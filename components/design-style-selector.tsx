"use client"

import { Ban, Paintbrush, Palette, PenTool, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DesignStyleSelectorProps {
  selectedStyle: string
  onSelectStyle: (style: string) => void
}

export default function DesignStyleSelector({ selectedStyle, onSelectStyle }: DesignStyleSelectorProps) {
  const styles = [
    { name: "None", icon: <Ban className="h-4 w-4" />, description: "No specific style" },
    { name: "Illustration", icon: <Palette className="h-4 w-4" />, description: "Hand-drawn look" },
    { name: "Pixel-Art", icon: <Square className="h-4 w-4" />, description: "8-bit retro style" },
    { name: "Calligraphy", icon: <PenTool className="h-4 w-4" />, description: "Elegant typography" },
    { name: "Graffiti", icon: <Paintbrush className="h-4 w-4" />, description: "Street art style" },
    { name: "Realistic", icon: <Paintbrush className="h-4 w-4" />, description: "Photorealistic" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style) => (
        <Button
          key={style.name}
          variant={selectedStyle === style.name ? "default" : "outline"}
          className={`group relative h-9 px-3 flex items-center gap-2 border rounded-md transition-all duration-200 ${
            selectedStyle === style.name 
              ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:border-purple-700" 
              : "border-gray-200 hover:border-purple-200 hover:bg-purple-50"
          }`}
          onClick={() => onSelectStyle(style.name)}
        >
          <div className={`p-1 rounded-full ${
            selectedStyle === style.name 
              ? "bg-white/20" 
              : "bg-gray-100"
          }`}>
            {style.icon}
          </div>
          <span className="text-sm font-medium">{style.name}</span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {style.description}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        </Button>
      ))}
    </div>
  )
}
