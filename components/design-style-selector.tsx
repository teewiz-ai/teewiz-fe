"use client"

import { Ban, Paintbrush, Palette, PenTool, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DesignStyleSelectorProps {
  selectedStyle: string
  onSelectStyle: (style: string) => void
}

export default function DesignStyleSelector({ selectedStyle, onSelectStyle }: DesignStyleSelectorProps) {
  const styles = [
    { name: "None", icon: <Ban className="h-5 w-5 mr-2" /> },
    { name: "Illustration", icon: <Palette className="h-5 w-5 mr-2" /> },
    { name: "Pixel-Art", icon: <Square className="h-5 w-5 mr-2" /> },
    { name: "Calligraphy", icon: <PenTool className="h-5 w-5 mr-2" /> },
    { name: "Graffiti", icon: <Paintbrush className="h-5 w-5 mr-2" /> },
    { name: "Minimal-Geo", icon: <Square className="h-5 w-5 mr-2" /> },
    {name: "Realistic", icon: <Paintbrush className="h-5 w-5 mr-2" /> },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((style) => (
        <Button
          key={style.name}
          variant={selectedStyle === style.name ? "default" : "outline"}
          className={`flex items-center justify-center border rounded-md px-3 py-2 ${
            selectedStyle === style.name ? "bg-gray-800 text-white" : ""
          }`}
          onClick={() => onSelectStyle(style.name)}
        >
          {style.icon}
          {style.name}
        </Button>
      ))}
    </div>
  )
}
