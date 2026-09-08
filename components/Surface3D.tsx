'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useRef, useMemo, useState, useEffect } from 'react'
import { generateSurfaceData, calculateContourLine, evaluateFunction } from '@/lib/math-utils'
import type { MathFunction } from '@/lib/types'
import { ThreeEvent } from '@react-three/fiber'

interface CriticalPoint {
  x: number
  y: number
  z: number
  type: 'max' | 'min' | 'saddle'
}

interface Surface3DProps {
  func: MathFunction
  onPointClick?: (point: { x: number; y: number; z: number }) => void
  isAutoRotating?: boolean
  contourLevel?: number
  earthquake?: boolean
  earthquakeMagnitude?: number
  drawMode?: boolean
  timeValue?: number
  criticalPoints?: CriticalPoint[]
}

function SurfaceMesh({ 
  func, 
  onPointClick, 
  contourLevel = 0,
  earthquake = false,
  earthquakeMagnitude = 0.5,
  drawMode = false,
  timeValue = 0,
  criticalPoints = []
}: Surface3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [drawnPoints, setDrawnPoints] = useState<THREE.Vector3[]>([])
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [originalPositions, setOriginalPositions] = useState<Float32Array | null>(null)
  const [currentRange, setCurrentRange] = useState({ min: 0, max: 1 })

  const generatedGeometry = useMemo(() => {
    let expression = func.expression
    
    if (timeValue !== 0) {
      expression = expression.replace(/t/g, `(${timeValue})`)
    }
    
    const data = generateSurfaceData(expression, func.domain, 50)
    const nextGeometry = new THREE.BufferGeometry()
    nextGeometry.setAttribute('position', new THREE.Float32BufferAttribute(data.vertices, 3))
    nextGeometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3))
    nextGeometry.setIndex(data.indices)
    nextGeometry.computeVertexNormals()
    setCurrentRange(data.range)
    return nextGeometry
  }, [func, timeValue])

  useEffect(() => {
    setGeometry(generatedGeometry)
    const positions = generatedGeometry.attributes.position.array
    setOriginalPositions(new Float32Array(positions))
  }, [generatedGeometry])

  useFrame(({ clock }) => {
    if (!geometry || !originalPositions) return
    if (!earthquake || earthquakeMagnitude === 0) {
      const pos = geometry.attributes.position.array
      for (let i = 0; i < pos.length; i++) {
        pos[i] = originalPositions[i]
      }
      geometry.attributes.position.needsUpdate = true
      geometry.computeVertexNormals()
      return
    }

    const t = clock.getElapsedTime()
    const positions = geometry.attributes.position.array
    const wave = Math.sin(t * 15) * Math.sin(t * 10) * earthquakeMagnitude * 0.3

    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions[i]
      const z = originalPositions[i + 2]
      const originalY = originalPositions[i + 1]
      const disturbance = wave * Math.sin(x * 2 + t * 2) * Math.cos(z * 2 + t * 1.5)
      positions[i + 1] = originalY + disturbance
    }
    
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  })

  const contourPoints = useMemo(() => {
    try {
      let expression = func.expression
      if (timeValue !== 0) {
        expression = expression.replace(/t/g, `(${timeValue})`)
      }
      const points = calculateContourLine(expression, contourLevel, func.domain)
      return points.map(p => new THREE.Vector3(p.x, contourLevel, p.y))
    } catch {
      return []
    }
  }, [func, contourLevel, timeValue])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (onPointClick) {
      const point = event.point as THREE.Vector3
      onPointClick({
        x: point.x,
        y: point.z,
        z: point.y,
      })
    }
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!drawMode) return
    const point = event.point as THREE.Vector3
    if (point) {
      let expression = func.expression
      if (timeValue !== 0) {
        expression = expression.replace(/t/g, `(${timeValue})`)
      }
      const z = evaluateFunction(expression, point.x, point.z)
      if (z !== null && isFinite(z)) {
        setDrawnPoints(prev => [...prev, new THREE.Vector3(point.x, z, point.z)])
      }
    }
  }

  if (!geometry) return null

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
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

      <mesh position={[0, contourLevel, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial
          color={0x00f0ff}
          transparent
          opacity={earthquake ? 0.15 : 0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {contourPoints.length > 2 && (
        <Line
          points={contourPoints}
          color={earthquake ? '#ff4444' : '#00f0ff'}
          lineWidth={2}
          opacity={earthquake ? 1 : 0.8}
        />
      )}

      {criticalPoints.map((p, i) => {
        const color = p.type === 'max' ? 0x00ff00 : p.type === 'min' ? 0x0088ff : 0xffcc00
        return (
          <mesh key={i} position={[p.x, p.z, p.y]}>
            <sphereGeometry args={[0.08]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )
      })}

      {drawnPoints.length > 1 && (
        <Line
          points={drawnPoints}
          color="#ff00ff"
          lineWidth={3}
          opacity={0.8}
        />
      )}

      <ambientLight intensity={earthquake ? 0.8 : 0.5} color={0xffffff} />
      <directionalLight position={[10, 15, 10]} intensity={earthquake ? 2 : 1.2} color={0xffffff} />
      <directionalLight position={[-10, 8, -10]} intensity={0.8} color={0x7c3aed} />
      <directionalLight position={[0, -10, 0]} intensity={earthquake ? 0.8 : 0.3} color={earthquake ? 0xff0000 : 0x00f0ff} />

      <Grid
        args={[10, 10]}
        cellSize={0.5}
        cellColor={earthquake ? 0x4a2a2a : 0x4a4a5e}
        sectionSize={5}
        sectionColor={earthquake ? 0x2a1a1a : 0x2a2a3e}
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />
    </group>
  )
}

export function Surface3D(props: Surface3DProps) {
  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [6, 6, 6], fov: 45, near: 0.1, far: 1000 }}
      style={{ 
        background: props.earthquake 
          ? 'linear-gradient(135deg, #1a0a0a 0%, #2a0a0a 100%)' 
          : 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)' 
      }}
    >
      <SurfaceMesh {...props} />
      <OrbitControls
        autoRotate={props.isAutoRotating}
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