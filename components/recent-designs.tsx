import { Card, CardContent } from "@/components/ui/card"

export default function RecentDesigns() {
  const designs = [
    { emoji: "🎮", name: "Synthwave tiger" },
    { emoji: "🔺", name: "Minimalist mountain" },
    { emoji: "🤖", name: "Comic-style robot" },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {designs.map((design, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4 flex items-center">
            <span className="text-2xl mr-3">{design.emoji}</span>
            <span className="font-medium">{design.name}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
