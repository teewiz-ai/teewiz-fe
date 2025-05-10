'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center } from '@react-three/drei';
import { ShirtProps } from './Shirt';

// Lazy-load Shirt component
const Shirt = dynamic(() => import('./Shirt').then((mod) => mod.default), {
    ssr: false,
    suspense: true,
});

export interface TshirtCanvasProps extends ShirtProps {}

const TshirtCanvas: React.FC<TshirtCanvasProps> = (props) => (
    <Canvas
        camera={{ position: [0, 1, 3], fov: 45 }}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
    >
        <ambientLight intensity={0.45} />
        <directionalLight
            position={[5, 10, 5]}
            intensity={1.2}
            castShadow={true}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
            <Center>
                <Shirt {...props} />
            </Center>

            <Environment preset="studio" />
        </Suspense>

        <OrbitControls makeDefault enablePan enableZoom enableRotate />
    </Canvas>
);

export default TshirtCanvas;
