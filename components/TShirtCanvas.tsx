"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useMemo, useState } from "react"
import { OrbitControls, Decal, Environment } from "@react-three/drei"
import { TextureLoader, MathUtils as M } from "three"
import { useGesture } from "@use-gesture/react"
import { Model as TshirtModelRaw } from "@/components/Tshirt" // rename your gltfjsx output to .tsx

interface TshirtCanvasProps {
    imageUrl: string
}

export default function TshirtCanvas({ imageUrl }: TshirtCanvasProps) {
    return (
        <Canvas
            frameloop="demand"
            camera={{ position: [0, 0, 3], fov: 15 }}
            className="w-full h-full"
        >
            <ambientLight intensity={0.7} />
            <directionalLight position={[4, 6, 4]} intensity={0.9} />
            <Suspense fallback={null}>
                <InteractiveTshirt imageUrl={imageUrl} />
                <Environment preset="city" />
            </Suspense>
            <OrbitControls makeDefault enablePan={false} />
        </Canvas>
    )
}

function InteractiveTshirt({ imageUrl }: { imageUrl: string }) {
    const texture = useMemo(() => new TextureLoader().load(imageUrl), [imageUrl])
    const [offset, setOffset] = useState<[number, number]>([0, 0])
    const [scale, setScale] = useState(0.6)
    const clamp = (v: number, min: number, max: number) => M.clamp(v, min, max)

    const bind = useGesture(
        {
            onDrag: ({ movement: [mx, my] }) => {
                const nx = clamp(mx / 200, -0.45, 0.45)
                const ny = clamp(-my / 200, -0.55, 0.4)
                setOffset([nx, ny])
            },
            onWheel: ({ delta: [, dy] }) =>
                setScale((s) => clamp(s - dy / 500, 0.25, 1.2)),
            onPinch: ({ offset: [d] }) =>
                setScale((s) => clamp(0.6 + d / 300, 0.25, 1.2)),
        },
        { drag: { filterTaps: true } }
    )

    return (
        <group {...bind()}>
            <TshirtModelRaw position={[0, -1.3, 0]}>
                <Decal
                    position={[offset[0], offset[1], 0.187]}
                    rotation={[0, 0, 0]}
                    scale={scale}
                    map={texture}
                />
            </TshirtModelRaw>
            <mesh
                position={[0, 0, 0.25]}
                rotation={[0, 0, 0]}
                visible={false}
                {...bind()}
            >
                <planeGeometry args={[1, 1.5]} />
                <meshBasicMaterial transparent={true} opacity={0} />
            </mesh>
        </group>
    )
}
