'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFireProps {
  enabled: boolean
  intensity?: number
  position?: [number, number, number]
}

export function ParticleFire({ enabled, intensity = 1, position = [0, 0, 0] }: ParticleFireProps) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particleCount = 200
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 2
      
      positions[i * 3] = position[0] + radius * Math.sin(theta) * Math.cos(phi)
      positions[i * 3 + 1] = position[1] + Math.random() * 2
      positions[i * 3 + 2] = position[2] + radius * Math.sin(theta) * Math.sin(phi)
      
      sizes[i] = 0.02 + Math.random() * 0.05
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 1] = 0.01 + Math.random() * 0.02
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    }
    
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    geo.userData.velocities = velocities
    
    return geo
  }, [])

  useFrame(({ clock }) => {
    if (!enabled || !particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const velocities = particlesRef.current.geometry.userData.velocities as Float32Array
    const time = clock.getElapsedTime()
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i * 3] * intensity
      positions[i * 3 + 1] += velocities[i * 3 + 1] * intensity
      positions[i * 3 + 2] += velocities[i * 3 + 2] * intensity
      
      // Reset if too high
      if (positions[i * 3 + 1] > 2) {
        const radius = Math.random() * 3
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI * 2
        
        positions[i * 3] = position[0] + radius * Math.sin(theta) * Math.cos(phi)
        positions[i * 3 + 1] = position[1] + Math.random() * 0.5
        positions[i * 3 + 2] = position[2] + radius * Math.sin(theta) * Math.sin(phi)
        
        velocities[i * 3] = (Math.random() - 0.5) * 0.01
        velocities[i * 3 + 1] = 0.01 + Math.random() * 0.02
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (!enabled) return null

  return (
    <points ref={particlesRef}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        color={0xff4400}
        size={0.05}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}