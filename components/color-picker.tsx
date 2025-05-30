"use client"

import { Check } from "lucide-react"

interface ColorPickerProps {
  selectedColor: string
  onSelectColor: (color: string) => void
}

export default function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  const colors = [
    { value: "#000000", bg: "bg-black" },
    { value: "#FFFFFF", bg: "bg-white border border-gray-200" },
    { value: "#F97316", bg: "bg-orange-500" },
    { value: "#EF4444", bg: "bg-red-500" },
    { value: "#1D4ED8", bg: "bg-blue-700" },
    { value: "#EC4899", bg: "bg-pink-500" },
    { value: "#4338CA", bg: "bg-indigo-700" },
    { value: "#34D399", bg: "bg-emerald-400" },
    { value: "#FACC15", bg: "bg-yellow-400" },
    { value: "#111827", bg: "bg-gray-900" },
  ]

  return (
    <div className="w-1/2">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          {colors.slice(0, 5).map((color) => (
            <button
              key={color.value}
              className={`w-8 h-8 rounded-md ${color.bg} flex items-center justify-center border-2 ${
                selectedColor === color.value ? "border-gray-400" : "border-transparent"
              }`}
              onClick={() => onSelectColor(color.value)}
            >
              {selectedColor === color.value && <Check className="text-white h-4 w-4" />}
            </button>
          ))}
        </div>
        <div className="flex justify-between">
          {colors.slice(5, 10).map((color) => (
            <button
              key={color.value}
              className={`w-8 h-8 rounded-md ${color.bg} flex items-center justify-center border-2 ${
                selectedColor === color.value ? "border-gray-400" : "border-transparent"
              }`}
              onClick={() => onSelectColor(color.value)}
            >
              {selectedColor === color.value && <Check className="text-white h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
