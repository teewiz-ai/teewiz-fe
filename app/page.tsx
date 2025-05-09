"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, ChevronRight } from "lucide-react"
import ColorPicker from "@/components/color-picker"
import DesignStyleSelector from "@/components/design-style-selector"
import Navigation from "@/components/navigation"
import {generateDesignFile} from "@/app/actions"
import { Loader2 } from "lucide-react"
import { login } from '@/lib/auth';
import { useRouter } from 'next/compat/router'
import {useAuth} from "@/components/useAuth";
import { createPrintfulProduct } from "@/app/actions";


export default function Home() {
  const session = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState("")
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [selectedStyle, setSelectedStyle] = useState("")
  const [designImage, setDesignImage] = useState("/images/tshirt-design.png")
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleBuy() {
    try {
      const prod = await createPrintfulProduct(
        designImage,          // e.g. "/generated/6d3e….jpg"
        selectedColor,        // "white", "black", …
        prompt.slice(0, 60)   // product title
      );
      console.log("Printful product:", prod.id);
    } catch (e) {
      alert("Couldn’t create product – please try again");
      return;
    }
    router.push("/checkout");   
  }

  const handleGenerateDesign = async () => {
    if (!prompt) return

    setIsGenerating(true)

    try {

      const designPrompt = `Generate a high‑resolution product mock‑up: a realistic ${selectedColor} T‑shirt (front view, studio lighting) with the following artwork printed centre‑front. Artwork description: "${prompt}". Render the artwork in ${selectedStyle} style. Show the entire T‑shirt; no additional objects or text.`;

      const result = await generateDesignFile(designPrompt);
      if (result.success) {
        setDesignImage(result.imageUrl);          // e.g. "/generated/6d3e….jpg"
      }
      else {
        console.error("Failed to generate design")
      }
    } catch (error) {
      console.error("Error generating design:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* T-shirt Preview */}
          <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <Image
                  src={designImage || "/images/tshirt.png"}
                  alt="T-shirt design"
                  width={300}
                  height={300}
                  className="w-full h-auto"
                  unoptimized
              />
            </div>
          </div>

          {/* Design Controls */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Describe your design...</h2>

            <Input
              placeholder="Describe your design..."
              className="mb-2"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <p className="text-gray-600 mb-6">e.g. "retro neon cyber-cat with sunglasses"</p>

            <DesignStyleSelector selectedStyle={selectedStyle} onSelectStyle={setSelectedStyle} />

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Color picker</h3>
              <ColorPicker selectedColor={selectedColor} onSelectColor={setSelectedColor} />
            </div>

            <Button
              className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white py-6"
              onClick={handleGenerateDesign}
              disabled={isGenerating || !prompt}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" /> Generate Design
                </>
              )}
            </Button>

            <Button
                variant="outline"
                className="w-full mt-4 py-6 border-2"
                onClick={handleBuy}
            >
              Buy Now
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your recent designs</h2>
            <Button variant="ghost" className="flex items-center">
              See all <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4 flex items-center">
              <span className="text-2xl mr-3">🎮</span>
              <span className="font-medium">Synthwave tiger</span>
            </div>
            <div className="bg-white border rounded-lg p-4 flex items-center">
              <span className="text-2xl mr-3">🔺</span>
              <span className="font-medium">Minimalist mountain</span>
            </div>
            <div className="bg-white border rounded-lg p-4 flex items-center">
              <span className="text-2xl mr-3">🤖</span>
              <span className="font-medium">Comic-style robot</span>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">💡</span>
            <h3 className="text-xl font-semibold">Need inspiration?</h3>
          </div>
          <p className="text-gray-600">Aggdonns, altiinset; sausettly, A100% to purchase.</p>
        </div>
      </main>
    </div>
  )
}
