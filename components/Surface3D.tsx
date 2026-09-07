'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useRef, useMemo, useState } from 'react'
import { generateSurfaceData, calculateContourLine } from '@/lib/math-utils'
import type { MathFunction } from '@/lib/types'
import { ThreeEvent } from '@react-three/fiber'

interface Surface3DProps {
  func: MathFunction
  onPointClick?: (point: { x: number; y: number; z: number }) => void
  isAutoRotating?: boolean
  contourLevel?: number
}

function SurfaceMesh({ func, onPointClick, contourLevel = 0 }: Surface3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Generar geometría de la superficie
  const geometry = useMemo(() => {
    const data = generateSurfaceData(func.expression, func.domain, 50)
    const nextGeometry = new THREE.BufferGeometry()
    nextGeometry.setAttribute('position', new THREE.Float32BufferAttribute(data.vertices, 3))
    nextGeometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3))
    nextGeometry.setIndex(data.indices)
    nextGeometry.computeVertexNormals()
    return nextGeometry
  }, [func])

  // Calcular curva de nivel
  const contourPoints = useMemo(() => {
    try {
      const points = calculateContourLine(func.expression, contourLevel, func.domain)
      return points.map(p => new THREE.Vector3(p.x, contourLevel, p.y))
    } catch {
      return []
    }
  }, [func, contourLevel])

  // Manejador de clic
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (onPointClick) {
      const mesh = event.object as THREE.Mesh
      if (mesh.geometry instanceof THREE.BufferGeometry) {
        const point = event.point as THREE.Vector3
        onPointClick({
          x: point.x,
          y: point.z,
          z: point.y,
        })
      }
    }
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <primitive object={geometry} attach="geometry" />
        <meshPhongMaterial
          vertexColors
          shininess={40}
          side={THREE.DoubleSide}
          emissive={new THREE.Color(0x113344)}
          emissiveIntensity={0.15}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Plano de corte */}
      <mesh position={[0, contourLevel, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial
          color={0x00f0ff}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Curva de nivel */}
      {contourPoints.length > 2 && (
        <Line
          points={contourPoints}
          color="#00f0ff"
          lineWidth={2}
          opacity={0.8}
        />
      )}

      {/* Iluminación */}
      <ambientLight intensity={0.5} color={0xffffff} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} color={0xffffff} />
      <directionalLight position={[-10, 8, -10]} intensity={0.8} color={0x7c3aed} />
      <directionalLight position={[0, -10, 0]} intensity={0.3} color={0x00f0ff} />

      <Grid
        args={[10, 10]}
        cellSize={0.5}
        cellColor={0x4a4a5e}
        sectionSize={5}
        sectionColor={0x2a2a3e}
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />
    </group>
  )
}

export function Surface3D({ func, onPointClick, isAutoRotating, contourLevel = 0 }: Surface3DProps) {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [6, 6, 6], fov: 45, near: 0.1, far: 1000 }}
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)' }}
    >
      <SurfaceMesh
        func={func}
        onPointClick={onPointClick}
        contourLevel={contourLevel}
      />
      <OrbitControls
        autoRotate={isAutoRotating}
        autoRotateSpeed={1.5}
        enableDamping
        dampingFactor={0.08}
        enableZoom
        minDistance={3}
        maxDistance={20}
      />
    </Canvas>
  )
}