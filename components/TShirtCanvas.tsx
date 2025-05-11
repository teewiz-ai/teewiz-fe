"use client"

import React, { useRef, useState, useEffect, FC } from "react"
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Text } from "react-konva"
import useImage from "use-image"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface TShirtCanvasProps {
    /** Base t‑shirt image URL (e.g. white shirt PNG) */
    shirtImage: string
    /** Transparent PNG design URL */
    designImage: string
    /** Width of the canvas in pixels */
    width?: number
    /** Height of the canvas in pixels */
    height?: number
    /** Called with a dataURL of the composed image when user confirms */
    onConfirm: (dataUrl: string, position: { x: number, y: number, width: number, height: number }) => void
}

const TShirtCanvas: FC<TShirtCanvasProps> = ({
                                                 shirtImage,
                                                 designImage,
                                                 width = 600,
                                                 height = 600,
                                                 onConfirm,
                                             }) => {
    // load images with crossOrigin
    const [shirt] = useImage("/tshirts/white-with-logo.png", 'anonymous')
    const [design, designStatus] = useImage(designImage, 'anonymous')

    // refs for Konva nodes
    const stageRef = useRef<any>(null)
    const designRef = useRef<any>(null)
    const trRef = useRef<any>(null)

    // selection state
    const [selected, setSelected] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Calculate initial design size (40% of t-shirt width)
    const getInitialDesignSize = () => {
        if (!design) return { width: 0, height: 0 }
        const aspectRatio = design.width / design.height
        const designWidth = width * 0.4
        return {
            width: designWidth,
            height: designWidth / aspectRatio
        }
    }

    // attach transformer when design is selected
    useEffect(() => {
        if (selected && trRef.current && designRef.current) {
            trRef.current.nodes([designRef.current])
            trRef.current.getLayer().batchDraw()
        }
    }, [selected, designStatus])

    // deselect when clicking outside
    const handleStageMouseDown = (e: any) => {
        if (e.target === stageRef.current || e.target.name() === "shirt") {
            setSelected(false)
        }
    }

    // select design when clicked
    const handleDesignClick = () => setSelected(true)

    // constrain design movement within t-shirt boundaries
    const handleDragMove = (e: any) => {
        const node = e.target
        // Allow free movement - clipping mask will handle visibility
        node.x(node.x())
        node.y(node.y())
    }

    // confirm composition with position
    const handleConfirm = () => {
        if (!designRef.current) return;
        
        const node = designRef.current;
        const position = {
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY()
        };
        
        onConfirm(stageRef.current.toDataURL({ pixelRatio: 1 }), position);
    }

    const initialSize = getInitialDesignSize()

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="relative">
                <Stage
                    width={width}
                    height={height}
                    ref={stageRef}
                    onMouseDown={handleStageMouseDown}
                    className="max-w-full max-h-full"
                >
                    <Layer>
                        {/* Base shirt */}
                        {shirt && (
                            <KonvaImage
                                image={shirt}
                                x={0}
                                y={0}
                                width={width}
                                height={height}
                                name="shirt"
                            />
                        )}

                        {/* Print area indicator */}
                        <KonvaImage
                            image={shirt}
                            x={0}
                            y={0}
                            width={width}
                            height={height}
                            opacity={0}
                        />
                        <Rect
                            x={width * 0.3}
                            y={height * 0.25}
                            width={width - (width * 0.3 * 2)}
                            height={height - (height * 0.25 * 2)}
                            stroke="#666"
                            strokeWidth={1}
                            dash={[5, 5]}
                        />
                        <Text
                            x={width * 0.3}
                            y={height * 0.25 + (height - (height * 0.25 * 2)) + 5}
                            text="Print Area"
                            fontSize={12}
                            fill="#666"
                        />
                    </Layer>

                    {/* Clipping mask for design */}
                    <Layer
                        clipFunc={(ctx) => {
                            const marginX = width * 0.3
                            const marginY = height * 0.25
                            ctx.beginPath()
                            ctx.rect(marginX, marginY, width - (marginX * 2), height - (marginY * 2))
                            ctx.closePath()
                        }}
                    >
                        {/* Design overlay */}
                        {design && (
                            <KonvaImage
                                image={design}
                                x={(width - initialSize.width) / 2}
                                y={(height - initialSize.height) / 2}
                                width={initialSize.width}
                                height={initialSize.height}
                                draggable
                                ref={designRef}
                                onClick={handleDesignClick}
                                onTap={handleDesignClick}
                                onDragMove={handleDragMove}
                            />
                        )}
                    </Layer>

                    {/* Transformer layer (must be separate) */}
                    <Layer>
                        {selected && (
                            <Transformer
                                ref={trRef}
                                rotateEnabled
                                enabledAnchors={[
                                    "top-left",
                                    "top-right",
                                    "bottom-left",
                                    "bottom-right",
                                ]}
                                boundBoxFunc={(oldBox, newBox) => {
                                    // Allow any size, but it will be clipped by the mask
                                    return newBox
                                }}
                            />
                        )}
                    </Layer>
                </Stage>

                <Button
                    className="absolute top-4 right-4 flex items-center bg-white hover:bg-gray-100 text-gray-900 shadow-md"
                    onClick={handleConfirm}
                    disabled={!design}
                >
                    <Check className="mr-2 h-4 w-4" /> Confirm Placement
                </Button>
            </div>
        </div>
    )
}

export default TShirtCanvas