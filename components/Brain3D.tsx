'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import RealBrainModel from './RealBrainModel'

function RealisticBrain() {
  const brainRef = useRef<any>(null)
  const timeRef = useRef(0)

  useFrame((state, delta) => {
    timeRef.current += delta
    if (brainRef.current) {
      brainRef.current.rotation.y = timeRef.current * 0.12
      brainRef.current.rotation.x = Math.sin(timeRef.current * 0.08) * 0.02
      brainRef.current.position.y = Math.sin(timeRef.current * 0.15) * 0.02
    }
  })

  return (
    <group ref={brainRef}>
      {/* Cérebro Principal - Hemisférios Unidos */}
      <mesh position={[0, 0, 0]} scale={[1.3, 1.1, 1.4]}>
        <sphereGeometry args={[1.0, 48, 48]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.9}
          emissive="#00D4FF"
          emissiveIntensity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sulco Central (Fissura Inter-hemisférica) */}
      <mesh position={[0, 0, 0]} scale={[0.02, 1.2, 1.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Lobo Frontal Esquerdo */}
      <mesh position={[-0.4, 0.4, 0.3]} scale={[0.6, 0.8, 0.7]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.85}
          emissive="#00D4FF"
          emissiveIntensity={0.06}
        />
      </mesh>

      {/* Lobo Frontal Direito */}
      <mesh position={[0.4, 0.4, 0.3]} scale={[0.6, 0.8, 0.7]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.85}
          emissive="#00D4FF"
          emissiveIntensity={0.06}
        />
      </mesh>

      {/* Lobo Parietal Esquerdo */}
      <mesh position={[-0.3, 0, 0.5]} scale={[0.5, 0.9, 0.6]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.8}
          emissive="#00D4FF"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Lobo Parietal Direito */}
      <mesh position={[0.3, 0, 0.5]} scale={[0.5, 0.9, 0.6]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.8}
          emissive="#00D4FF"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Lobo Temporal Esquerdo */}
      <mesh position={[-0.6, -0.2, -0.2]} scale={[0.4, 0.7, 0.8]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.75}
          emissive="#00D4FF"
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* Lobo Temporal Direito */}
      <mesh position={[0.6, -0.2, -0.2]} scale={[0.4, 0.7, 0.8]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.75}
          emissive="#00D4FF"
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* Lobo Occipital Esquerdo */}
      <mesh position={[-0.2, -0.3, 0.7]} scale={[0.4, 0.6, 0.5]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.7}
          emissive="#00D4FF"
          emissiveIntensity={0.03}
        />
      </mesh>

      {/* Lobo Occipital Direito */}
      <mesh position={[0.2, -0.3, 0.7]} scale={[0.4, 0.6, 0.5]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#00D4FF"
          transparent
          opacity={0.7}
          emissive="#00D4FF"
          emissiveIntensity={0.03}
        />
      </mesh>

      {/* Cerebelo - Hemisfério Esquerdo */}
      <mesh position={[-0.3, -1.0, -0.2]} scale={[0.4, 0.6, 0.8]}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial
          color="#00FFFF"
          transparent
          opacity={0.8}
          emissive="#00FFFF"
          emissiveIntensity={0.06}
        />
      </mesh>

      {/* Cerebelo - Hemisfério Direito */}
      <mesh position={[0.3, -1.0, -0.2]} scale={[0.4, 0.6, 0.8]}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial
          color="#00FFFF"
          transparent
          opacity={0.8}
          emissive="#00FFFF"
          emissiveIntensity={0.06}
        />
      </mesh>

      {/* Verme do Cerebelo */}
      <mesh position={[0, -1.0, -0.3]} scale={[0.2, 0.4, 0.6]}>
        <sphereGeometry args={[0.4, 20, 20]} />
        <meshStandardMaterial
          color="#00FFFF"
          transparent
          opacity={0.85}
          emissive="#00FFFF"
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Tronco Cerebral - Ponte */}
      <mesh position={[0, -1.2, 0]} scale={[0.3, 0.2, 0.4]}>
        <sphereGeometry args={[0.5, 20, 20]} />
        <meshStandardMaterial
          color="#8B5CF6"
          transparent
          opacity={0.9}
          emissive="#8B5CF6"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Tronco Cerebral - Bulbo */}
      <mesh position={[0, -1.4, 0]} scale={[0.25, 0.3, 0.3]}>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 16]} />
        <meshStandardMaterial
          color="#8B5CF6"
          transparent
          opacity={0.95}
          emissive="#8B5CF6"
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* Corpo Caloso */}
      <mesh position={[0, 0, 0]} scale={[0.1, 1.0, 0.25]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 12]} />
        <meshStandardMaterial
          color="#EC4899"
          transparent
          opacity={0.6}
          emissive="#EC4899"
          emissiveIntensity={0.03}
        />
      </mesh>

      {/* Giros e Sulcos - detalhes anatômicos */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const radius = 1.1 + Math.sin(angle * 3) * 0.1
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius * 0.7
        const y = Math.sin(angle * 2) * 0.3
        
        return (
          <mesh key={i} position={[x * 0.8, y, z]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial
              color="#00D4FF"
              transparent
              opacity={0.2}
              emissive="#00D4FF"
              emissiveIntensity={0.01}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function EnhancedNeuralNetwork({ isProcessing = false }: { isProcessing?: boolean }) {
  const networkRef = useRef<any>(null)
  
  const connections = useMemo(() => {
    const points = []
    
    // Múltiplas camadas de conexões neurais
    for (let layer = 0; layer < 3; layer++) {
      const layerRadius = 5 + layer * 0.8
      const nodeCount = 12 + layer * 4
      
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2
        const height = Math.sin(angle * 2) * 0.8 + layer * 0.3
        
        const start = new THREE.Vector3(
          Math.cos(angle) * layerRadius,
          height,
          Math.sin(angle) * layerRadius * 0.7
        )
        
        // Conectar com próximos nós
        const nextAngle = ((i + 1) % nodeCount) / nodeCount * Math.PI * 2
        const nextHeight = Math.sin(nextAngle * 2) * 0.8 + layer * 0.3
        
        const end = new THREE.Vector3(
          Math.cos(nextAngle) * layerRadius,
          nextHeight,
          Math.sin(nextAngle) * layerRadius * 0.7
        )
        
        points.push({
          start,
          end,
          color: layer === 0 ? "#00FFFF" : layer === 1 ? "#8B5CF6" : "#EC4899",
          opacity: isProcessing ? (0.8 - layer * 0.2) : (0.4 - layer * 0.1),
          layer
        })
      }
    }
    
    return points
  }, [isProcessing])

  useFrame((state) => {
    if (networkRef.current) {
      const speed = isProcessing ? 0.15 : 0.08
      networkRef.current.rotation.y = state.clock.elapsedTime * speed
    }
  })

  return (
    <group ref={networkRef}>
      {connections.map((connection, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                connection.start.x, connection.start.y, connection.start.z,
                connection.end.x, connection.end.y, connection.end.z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={connection.color}
            transparent 
            opacity={connection.opacity}
          />
        </line>
      ))}
    </group>
  )
}

function EnhancedNeuralNodes({ isProcessing = false }: { isProcessing?: boolean }) {
  const nodesRef = useRef<any>(null)
  
  const nodes = useMemo(() => {
    const allNodes = []
    
    // Múltiplas camadas de nós
    for (let layer = 0; layer < 4; layer++) {
      const radius = 4.5 + layer * 1.2
      const nodeCount = 8 + layer * 2
      
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2
        const height = Math.sin(angle * 2) * 0.6 + layer * 0.4
        
        allNodes.push({
          position: [
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius * 0.7
          ] as [number, number, number],
          color: ["#00D4FF", "#00FFFF", "#8B5CF6", "#EC4899"][layer],
          size: 0.03 + layer * 0.01,
          layer
        })
      }
    }
    
    return allNodes
  }, [])

  useFrame((state) => {
    if (nodesRef.current) {
      const speed = isProcessing ? 0.12 : 0.06
      nodesRef.current.rotation.y = state.clock.elapsedTime * speed
    }
  })

  return (
    <group ref={nodesRef}>
      {nodes.map((node, index) => (
        <NeuralNodeMesh key={index} node={node} index={index} isProcessing={isProcessing} />
      ))}
    </group>
  )
}

// Single animated neural node — extracted so hooks are not called inside a map().
function NeuralNodeMesh({
  node,
  index,
  isProcessing,
}: {
  node: { position: [number, number, number]; color: string; size: number; layer: number }
  index: number
  isProcessing: boolean
}) {
  const nodeRef = useRef<any>(null)

  useFrame((state) => {
    if (!nodeRef.current) return
    const time = state.clock.elapsedTime
    if (isProcessing) {
      const pulse = Math.sin(time * 5 + index * 0.4) * 0.4 + 0.6
      const wave = Math.sin(time * 2 + index * 0.2) * 0.3
      nodeRef.current.material.emissiveIntensity = pulse * 1.0
      nodeRef.current.scale.setScalar(1 + pulse * 0.3 + wave * 0.2)
    } else {
      const pulse = Math.sin(time * 2 + index * 0.3) * 0.2 + 0.8
      nodeRef.current.material.emissiveIntensity = pulse * 0.3
      nodeRef.current.scale.setScalar(1 + pulse * 0.1)
    }
  })

  return (
    <mesh ref={nodeRef} position={node.position}>
      <sphereGeometry args={[node.size, 12, 12]} />
      <meshStandardMaterial
        color={node.color}
        transparent
        opacity={isProcessing ? 0.9 : 0.7}
        emissive={node.color}
        emissiveIntensity={isProcessing ? 0.8 : 0.3}
      />
    </mesh>
  )
}

function StaticOrbs() {
  const orbs = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      position: [
        Math.cos((i / 6) * Math.PI * 2) * 5.5,
        Math.sin((i / 6) * Math.PI * 2) * 0.3,
        Math.sin((i / 6) * Math.PI * 2) * 4.0
      ] as [number, number, number],
      color: i % 2 === 0 ? "#EC4899" : "#00FFFF"
    }))
  }, [])

  return (
    <group>
      {orbs.map((orb, index) => (
        <Sphere
          key={index}
          args={[0.06, 12, 12]}
          position={orb.position}
        >
          <meshStandardMaterial
            color={orb.color}
            transparent
            opacity={0.5}
            emissive={orb.color}
            emissiveIntensity={0.15}
          />
        </Sphere>
      ))}
    </group>
  )
}

export default function Brain3D({ useRealModel = true, modelUrl = '/models/Brain_3d.glb', isProcessing = false }: { useRealModel?: boolean, modelUrl?: string, isProcessing?: boolean }) {
  return (
    <group>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={2.5} color="#00D4FF" />
      <pointLight position={[-5, -5, -5]} intensity={2.0} color="#8B5CF6" />
      <pointLight position={[0, 4, 4]} intensity={1.5} color="#00FFFF" />
      
      {useRealModel && modelUrl ? (
        <RealBrainModel url={modelUrl} isProcessing={isProcessing} />
      ) : (
        <RealisticBrain />
      )}
      
      {/* Rede Neural Melhorada */}
      <EnhancedNeuralNetwork isProcessing={isProcessing} />
      
      {/* Nós Neurais Melhorados */}
      <EnhancedNeuralNodes isProcessing={isProcessing} />
      
      {/* Orbes Estáticos */}
      <StaticOrbs />
    </group>
  )
}
