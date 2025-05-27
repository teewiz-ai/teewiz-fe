"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, ChevronRight } from "lucide-react"
import ColorPicker from "@/components/color-picker"
import DesignStyleSelector from "@/components/design-style-selector"
import Navigation from "@/components/navigation"
import {generateDesignFile, generateMockupDataUrl} from "@/app/actions"
import { Loader2 } from "lucide-react"
import { login } from '@/lib/auth';
import { useRouter } from 'next/compat/router'
import {useAuth} from "@/components/useAuth";

import { createPrintfulProduct } from "@/app/actions";
import dynamic from "next/dynamic"

const TShirtCanvas = dynamic(() => import("@/components/TShirtCanvas.client"), {
  ssr: false,
  loading: () => <p>Loading canvas…</p>,
})

export default function Home() {
  // const session = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState("")
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [selectedStyle, setSelectedStyle] = useState("")
  const [designImage, setDesignImage] = useState("https://teeverse-designs-eu.s3.eu-central-1.amazonaws.com/generated/7285557b-3847-405d-935c-7921f1bc8296.jpg")
  const [isGenerating, setIsGenerating] = useState(false)
  const [mockupUrl, setMockupUrl] = useState<string>("")
  const [designPosition, setDesignPosition] = useState<{ x: number, y: number, width: number, height: number } | null>(null)

  async function handleBuy() {
    try {
      const prod = await createPrintfulProduct(
        designImage,          // e.g. "/generated/6d3e….jpg"
        selectedColor,        // "white", "black", …
        prompt.slice(0, 60),  // product title
        designPosition        // pass the design position
      );
      console.log("Printful product:", prod.id);
    } catch (e) {
      return;
    }
    router.push("/checkout");   
  }

  const handleGenerateAndPreview = async () => {
    if (!prompt) return
    setIsGenerating(true)

    try {
      const designPrompt = `Generate a high-resolution transparent PNG design (opacity = 1).\nArtwork description: "${prompt}". \nRender the artwork in "${selectedStyle}" style. \nProvide only the design on a fully transparent background`
      const result = await generateDesignFile(designPrompt)
      if (!result.success) throw new Error("Design failed")
      setDesignImage(result.imageUrl)

      const urlParts = result.imageUrl.split('/')
      const s3Key = urlParts.slice(-2).join('/')
      const mockup = await generateMockupDataUrl(s3Key, "#00ff00")
      setMockupUrl(mockup)

    } catch (error) {
      console.error(error)
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
            <div className="relative w-full h-[600px]">
              {mockupUrl ? (
                  <div className="relative w-full h-full">
                      <Image
                          src={mockupUrl}
                          alt="Final t-shirt mockup"
                          fill
                          className="object-contain"
                      />
                      <Button
                          className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-900 shadow-md"
                          onClick={() => setMockupUrl("")}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                              <path d="m15 5 4 4"/>
                          </svg>
                          Edit Design
                      </Button>
                  </div>
              ) : designImage ? (
                  <div className="w-full h-full">
                      <TShirtCanvas
                          shirtImage="/tshirts/white.png"
                          designImage={designImage}
                          width={600}
                          height={600}
                          onConfirm={async (dataUrl, position) => {
                              try {
                                  // Extract the S3 key from the design image URL
                                  const urlParts = designImage.split('/');
                                  const s3Key = urlParts.slice(-2).join('/');
                                  
                                  // Store the position for the mockup generation
                                  setDesignPosition(position);
                                  
                                  // Generate the blended mockup with position
                                  const mockupDataUrl = await generateMockupDataUrl(s3Key, selectedColor, position);
                                  setMockupUrl(mockupDataUrl);
                                  console.log("Mockup generated successfully");
                              } catch (error) {
                                  console.error("Error generating mockup:", error);
                              }
                          }}
                      />
                  </div>
              ) : (
                  <p className="text-gray-500">Preview will appear here</p>
              )}
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
              onClick={handleGenerateAndPreview}
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
