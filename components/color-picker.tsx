"use client"

import { Check } from "lucide-react"

interface ColorPickerProps {
  selectedColor: string
  onSelectColor: (color: string) => void
}

export default function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  const colors = [
    { value: "#000000", bg: "bg-black" },
    { value: "#F97316", bg: "bg-orange-500" },
    { value: "#EF4444", bg: "bg-red-500" },
    { value: "#E5E7EB", bg: "bg-gray-200" },
    { value: "#86EFAC", bg: "bg-green-300" },
    { value: "#FACC15", bg: "bg-yellow-400" },
    { value: "#1D4ED8", bg: "bg-blue-700" },
    { value: "#FDBA74", bg: "bg-orange-200" },
    { value: "#EC4899", bg: "bg-pink-500" },
    { value: "#4338CA", bg: "bg-indigo-700" },
    { value: "#34D399", bg: "bg-emerald-400" },
    { value: "#14B8A6", bg: "bg-teal-500" },
    { value: "#A78BFA", bg: "bg-purple-400" },
    { value: "#111827", bg: "bg-gray-900" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color.value}
          className={`w-10 h-10 rounded-md ${color.bg} flex items-center justify-center border-2 ${selectedColor === color.value ? "border-gray-400" : "border-transparent"}`}
          onClick={() => onSelectColor(color.value)}
        >
          {selectedColor === color.value && <Check className="text-white h-5 w-5" />}
        </button>
      ))}
    </div>
  )
}
