"use client"

import { useState } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useRouter } from "next/compat/router"
import { Sparkles, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import ColorPicker from "@/components/color-picker"
import DesignStyleSelector from "@/components/design-style-selector"

import { generateDesignFile, generateMockupDataUrl, createPrintfulProduct } from "@/app/actions"
import { useAuth } from "@/components/useAuth"

const TShirtCanvas = dynamic(() => import("@/components/TShirtCanvas.client"), {
  ssr: false,
  loading: () => <p>Loading canvas…</p>,
})

export default function Home() {
  const router = useRouter()
  // const { user, loading: authLoading } = useAuth()

  const [prompt, setPrompt] = useState("")
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [selectedStyle, setSelectedStyle] = useState("")
  const [designImage, setDesignImage] = useState<string>("https://teeverse-designs-eu.s3.eu-central-1.amazonaws.com/generated/7285557b-3847-405d-935c-7921f1bc8296.jpg")
  const [isGenerating, setIsGenerating] = useState(false)
  const [mockupUrl, setMockupUrl] = useState<string>("")
  const [designPosition, setDesignPosition] = useState<{ x: number, y: number, width: number, height: number } | null>(null)

  async function handleBuy() {
    try {
      const prod = await createPrintfulProduct(
          designImage,
          selectedColor,
          prompt.slice(0, 60),
          designPosition
      )
      console.log("Printful product:", prod.id)
      router.push("/checkout")
    } catch (e) {
      console.error("Failed to create product", e)
    }
  }

  const handleGenerateAndPreview = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const designPrompt = `Generate a high-resolution transparent PNG design (opacity = 1).
Artwork description: "${prompt}".
Render the artwork in "${selectedStyle}" style.
Provide only the design on a fully transparent background.`
      const result = await generateDesignFile(designPrompt)
      if (!result.success) throw new Error("Design generation failed")
      setDesignImage(result.imageUrl)

      const urlParts = result.imageUrl.split('/')
      const s3Key = urlParts.slice(-2).join('/')
      const mockup = await generateMockupDataUrl(s3Key, selectedColor)
      setMockupUrl(mockup)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-purple-600" />,
      title: "AI-Powered Design",
      description: "Advanced AI creates unique designs from your text prompts",
    },
    {
      icon: <Image src="/tshirt-icon.svg" alt="T-Shirt" width={24} height={24} className="text-purple-600" />,
      title: "Multiple T-Shirt Styles",
      description: "Preview your design on various t-shirt colors and styles",
    },
    {
      icon: <Image src="/palette-icon.svg" alt="Palette" width={24} height={24} className="text-purple-600" />,
      title: "Customizable Colors",
      description: "Adjust colors, size, and placement to perfect your design",
    },
  ]

  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col font-sans antialiased text-gray-800">
        {/* Transparent Navbar */}
        <header className="border-b bg-white/20 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">TeeWiz</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Gallery</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">Pricing</a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">About</a>
              {/*{user ? (*/}
              {/*    <Button variant="outline">Account</Button>*/}
              {/*) : (*/}
              {/*    <Button variant="outline" onClick={() => login()}>Sign In</Button>*/}
              {/*)}*/}
              <Button variant="outline">Account</Button>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-4 w-4 mr-1" />
            AI-Powered Design Generator
          </Badge>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Turn Your Ideas Into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            {" "}Wearable Art
          </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Simply describe your vision and watch our AI create stunning, unique t-shirt designs in seconds.
          </p>
        </section>

        {/* Main Design Interface */}
        <main className="container mx-auto px-4 py-6 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* T-shirt Preview */}
            <div className="bg-white rounded-lg p-8 flex items-center justify-center border border-gray-200 shadow-lg">
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
                        Edit Design
                      </Button>
                    </div>
                ) : designImage ? (
                    <TShirtCanvas
                        shirtImage="/tshirts/white.png"
                        designImage={designImage}
                        width={600}
                        height={600}
                        onConfirm={async (dataUrl, position) => {
                          const urlParts = designImage.split('/')
                          const s3Key = urlParts.slice(-2).join('/')
                          setDesignPosition(position)
                          const mockupDataUrl = await generateMockupDataUrl(s3Key, selectedColor, position)
                          setMockupUrl(mockupDataUrl)
                        }}
                    />
                ) : (
                    <p className="text-gray-500">Preview will appear here</p>
                )}
              </div>
            </div>

            {/* Design Controls */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-lg">
              <div className="space-y-6">
                {/* Prompt Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Create Your Design</h2>
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI-Powered
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="Describe your design idea..."
                      className="h-12 pl-4 pr-12 text-base border-2 focus:border-purple-500 focus:ring-purple-500"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Try: "retro neon cyber-cat with sunglasses" or "minimalist mountain landscape"</p>
                </div>

                {/* Style Selector */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Art Style</h3>
                  <DesignStyleSelector selectedStyle={selectedStyle} onSelectStyle={setSelectedStyle} />
                </div>

                {/* Color Picker */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">T-Shirt Color</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ColorPicker selectedColor={selectedColor} onSelectColor={setSelectedColor} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={handleGenerateAndPreview}
                    disabled={isGenerating || !prompt.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Design...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" /> Generate Design
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 text-gray-700 font-medium rounded-lg transition-all duration-200"
                    onClick={handleBuy}
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Buy Now
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TeeWiz.ai?</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our advanced AI technology makes creating professional t-shirt designs accessible to everyone
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {features.map((feature, idx) => (
                  <div key={idx} className="text-center rounded-lg p-6 shadow-md">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      {feature.icon}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} TeeWiz. All rights reserved.</p>
          </div>
        </footer>
      </div>
  )
}
