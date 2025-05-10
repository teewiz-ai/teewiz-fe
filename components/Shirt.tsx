// components/Shirt.tsx
import React, {forwardRef, useRef, useMemo, useEffect, useState} from 'react';
import { useGLTF, Decal, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import {Mesh, Color, Vector3, Box3, ClampToEdgeWrapping} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

export interface ShirtProps {
    /** Base color of the shirt (hex or array) */
    color: string | [number, number, number];
    /** URL of the logo decal texture (small print) */
    logoTextureUrl?: string;
    /** URL of the full-shirt decal texture (covers entire mesh) */
    fullTextureUrl?: string;
    /** Toggle full-shirt texture */
    isFullTexture?: boolean;
    /** Toggle logo decal texture */
    isLogoTexture?: boolean;
}

const Shirt = forwardRef<Mesh, ShirtProps>(
    (
        { color, logoTextureUrl, fullTextureUrl, isFullTexture, isLogoTexture },
        ref
    ) => {
        const { nodes, materials } = useGLTF('/models/tshirt.glb');
        const logoMap = useTexture(logoTextureUrl || '');
        const fullMap = useTexture(fullTextureUrl || '');
        const texture = useTexture("/images/tshirt.png");

        // Merge all shirt body parts into one geometry
        const mergedGeometry = useMemo(() => {
            const geoms = [
                nodes.Object_2.geometry,
                nodes.Object_3.geometry,
                nodes.Object_4.geometry,
                nodes.Object_5.geometry
            ];
            return mergeGeometries(geoms, true);
        }, [nodes]);

        // Smoothly transition the material color
        useFrame((state, delta) =>
            easing.dampC(
                (materials['Material.001'] as any).color,
                new Color(color),
                0.25,
                delta
            )
        );

        // 3) Keep decal scale constant
        const decalScale: [number, number, number] = [0.3, 0.2, 0.4];
        const decalAspect = decalScale[0] / decalScale[1];

        // 4) Scale the image (texture) to fit within decal bounds
        useEffect(() => {
            if (!texture.image) return;
            const imgW = texture.image.height;
            const imgH = texture.image.width;
            const imgAspect = imgW / imgH;
            let uRepeat: number, vRepeat: number;
            console.log(imgH)
            if (imgAspect > decalAspect) {
                // image is wider: fit to decal width
                uRepeat = 1;
                vRepeat = decalAspect / imgAspect;
            } else {
                // image is taller: fit to decal height
                uRepeat = imgAspect / decalAspect;
                vRepeat = 1;
            }

            texture.wrapS = ClampToEdgeWrapping;
            texture.wrapT = ClampToEdgeWrapping;
            texture.repeat.set(uRepeat, vRepeat);
            texture.offset.set((1 - uRepeat) / 2, (1 - vRepeat) / 2);
        }, [texture, decalAspect]);


        return (
            <group ref={ref} dispose={null}>
                <group rotation={[-Math.PI / 2, 0, 0]}>

                    {/* Single merged mesh for performance */}
                    <mesh
                        geometry={mergedGeometry}
                        material={materials['Material.001']}
                        castShadow={true}
                        receiveShadow={true}
                    >
                        <Decal
                            debug={true}
                            position={[0, -0.1, 1.3]}
                            rotation={[0, 0, 0]}
                            scale={[0.3, 0.2, 0.4]}
                        >
                            <meshBasicMaterial
                                map={texture}
                                polygonOffset={true}
                                polygonOffsetFactor={-1}
                            />
                        </Decal>
                    </mesh>

                </group>
            </group>
        );
    }
);

useGLTF.preload('/models/tshirt.glb');

export default Shirt;