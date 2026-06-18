import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Html } from "@react-three/drei";
import type * as THREE from "three";
import { subscribeLia } from "@/lib/lia-sign-library";

interface Lia3DStageProps {
  /**
   * Caminho do GLB riggado da Lia. Quando o arquivo existir em
   * `/models/lia.glb` (ou outro path), ele é carregado e usado no lugar
   * do placeholder. Sem arquivo, mostra placeholder elegante.
   */
  modelUrl?: string;
  className?: string;
  /** Mostrar OrbitControls (debug/inspeção) */
  enableControls?: boolean;
  /** Cor de fundo do canvas (default: transparente) */
  background?: string | null;
}

/**
 * <Lia3DStage /> — Cena React Three Fiber pronta para receber o avatar 3D
 * riggado da Lia.
 *
 * Hoje: renderiza um placeholder (cápsula lilás suave) enquanto não há GLB.
 *       O placeholder reage a `playSign(gloss)` com um leve bounce, provando
 *       que o pipeline (subscribeLia → animação) está vivo.
 *
 * Quando o modelo riggado for entregue:
 *   1. Coloque o arquivo em `public/models/lia.glb`
 *   2. Passe `modelUrl="/models/lia.glb"`
 *   3. Adicione um arquivo de animações por gloss (ou mesclado) e mapeie
 *      `SIGN_LIBRARY[gloss].animationUrl` → action name.
 *   4. O hook abaixo (`useGLTFOrPlaceholder`) já carrega o modelo via
 *      `useGLTF` quando existe — zero refactor neste componente.
 */
export function Lia3DStage({
  modelUrl,
  className,
  enableControls = false,
  background = null,
}: Lia3DStageProps) {
  return (
    <div className={className} style={{ minHeight: 320 }}>
      <Canvas
        camera={{ position: [0, 1.4, 2.6], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: background ?? "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} castShadow />
        <directionalLight position={[-2, 2, -1]} intensity={0.35} color="#c9a8ff" />

        <Suspense fallback={<Html center><span className="text-xs text-muted-foreground">Carregando Lia…</span></Html>}>
          <LiaModelOrPlaceholder modelUrl={modelUrl} />
          <Environment preset="studio" />
        </Suspense>

        {enableControls && <OrbitControls enablePan={false} target={[0, 1, 0]} />}
      </Canvas>
    </div>
  );
}

function LiaModelOrPlaceholder({ modelUrl }: { modelUrl?: string }) {
  if (modelUrl) return <LiaGLTF url={modelUrl} />;
  return <LiaPlaceholder />;
}

/**
 * Carregador do GLB real. Mantido isolado para que `useGLTF` só seja
 * chamado quando há `modelUrl` (caso contrário, dispararia um fetch falho).
 */
function LiaGLTF({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const ref = useRef<THREE.Group>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    return subscribeLia(() => {
      setPulse((p) => p + 1);
      // TODO: quando houver `gltf.animations`, disparar AnimationAction
      // correspondente a `event.sign?.animationUrl` aqui.
    });
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    // respiração leve
    ref.current.position.y = Math.sin(performance.now() / 1000) * 0.02;
    if (pulse > 0) {
      ref.current.rotation.y += dt * 0.4;
    }
  });

  return <primitive ref={ref} object={gltf.scene} dispose={null} />;
}

/** Placeholder amigável enquanto o GLB real não está disponível. */
function LiaPlaceholder() {
  const ref = useRef<THREE.Group>(null);
  const signRef = useRef(0);

  useEffect(() => {
    return subscribeLia((evt) => {
      signRef.current = evt.sign?.durationMs ?? 900;
    });
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    ref.current.position.y = 1.05 + Math.sin(t * 1.4) * 0.02;
    if (signRef.current > 0) {
      ref.current.rotation.y += dt * 1.4;
      signRef.current -= dt * 1000;
    } else {
      ref.current.rotation.y += dt * 0.15;
    }
  });

  return (
    <group ref={ref}>
      {/* Cabeça */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshStandardMaterial color="#f4d3b8" roughness={0.6} />
      </mesh>
      {/* Cabelo */}
      <mesh position={[0, 0.62, -0.05]}>
        <sphereGeometry args={[0.4, 48, 48, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.9} />
      </mesh>
      {/* Tronco / camiseta lilás */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.6, 8, 24]} />
        <meshStandardMaterial color="#c9a8ff" roughness={0.7} />
      </mesh>
      {/* Olhos */}
      <mesh position={[-0.11, 0.58, 0.3]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#2a1810" />
      </mesh>
      <mesh position={[0.11, 0.58, 0.3]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#2a1810" />
      </mesh>
    </group>
  );
}

// Não pré-carrega — só quando um modelUrl for fornecido pelo consumidor.
