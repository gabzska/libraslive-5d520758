import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Html, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { subscribeLia, getSign } from "@/lib/lia-sign-library";

interface Lia3DStageProps {
  /**
   * Caminho do GLB riggado da Lia. Default: `/models/lia.glb`.
   * Se o arquivo não existir, o componente cai num placeholder elegante
   * sem quebrar o app.
   */
  modelUrl?: string;
  className?: string;
  enableControls?: boolean;
  background?: string | null;
}

/**
 * <Lia3DStage /> — Cena React Three Fiber com pipeline completo:
 *
 *   Texto → gloss → SIGN_LIBRARY[gloss].animationUrl → GLBLoader → AnimationMixer → rig
 *
 * O componente:
 *  1. Carrega o avatar principal de `/models/lia.glb` (ou `modelUrl`)
 *  2. Escuta `subscribeLia()` (pub/sub global)
 *  3. Quando um gloss chega, baixa o GLB de animação correspondente,
 *     mescla a clip no skeleton do avatar e dispara a `AnimationAction`
 *  4. Faz crossfade entre animações (idle ↔ sign ↔ idle)
 *
 * Se o GLB do modelo ainda não foi entregue, mostra um placeholder amigável
 * (mesmo placeholder que antes), e os comandos `playSign` continuam disparando
 * o pub/sub sem erro.
 */
export function Lia3DStage({
  modelUrl = "/models/lia.glb",
  className,
  enableControls = false,
  background = null,
}: Lia3DStageProps) {
  return (
    <div className={className} style={{ minHeight: 320 }}>
      <Canvas
        camera={{ position: [0, 1.5, 2.8], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: background ?? "transparent" }}
        shadows
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 4, 2]} intensity={1.15} castShadow />
        <directionalLight position={[-2, 2, -1]} intensity={0.35} color="#c9a8ff" />

        <Suspense
          fallback={
            <Html center>
              <span className="text-xs text-muted-foreground">Carregando Lia…</span>
            </Html>
          }
        >
          <LiaSceneRoot modelUrl={modelUrl} />
          <Environment preset="studio" />
        </Suspense>

        {enableControls && <OrbitControls enablePan={false} target={[0, 1, 0]} />}
      </Canvas>
    </div>
  );
}

/**
 * Tenta carregar o modelo. Se falhar (arquivo ainda não existe), renderiza
 * o placeholder no lugar — sem propagar o erro para a árvore.
 */
function LiaSceneRoot({ modelUrl }: { modelUrl: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(modelUrl, { method: "HEAD" })
      .then((r) => !cancelled && setAvailable(r.ok))
      .catch(() => !cancelled && setAvailable(false));
    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  if (available === null) return null;
  if (available) return <LiaRig url={modelUrl} />;
  return <LiaPlaceholder />;
}

/* ──────────────────────────────────────────────────────────────
 * Cache global de clips de animação (GLB → AnimationClip[])
 * Evita refazer download/parse a cada playSign.
 * ────────────────────────────────────────────────────────────── */
const clipCache = new Map<string, Promise<THREE.AnimationClip[]>>();
const glbLoader = new GLTFLoader();

function loadClips(url: string): Promise<THREE.AnimationClip[]> {
  let p = clipCache.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      glbLoader.load(
        url,
        (gltf) => resolve(gltf.animations ?? []),
        undefined,
        (err) => reject(err),
      );
    });
    clipCache.set(url, p);
  }
  return p;
}

/* ──────────────────────────────────────────────────────────────
 * Rig real — carrega o GLB do avatar e expõe o pipeline de animação.
 * ────────────────────────────────────────────────────────────── */
function LiaRig({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Animações embutidas no próprio GLB do avatar (ex: idle).
  const { actions, mixer, names } = useAnimations(gltf.animations ?? [], groupRef);

  // Action atualmente tocando para um sinal — guardada para fazer crossfade.
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  // Cache de actions criadas a partir de clips externos, por URL.
  const externalActionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());

  // Action idle (se existir uma clip chamada Idle/idle/IDLE no GLB).
  const idleAction = useMemo<THREE.AnimationAction | null>(() => {
    const idleName = names.find((n) => /idle/i.test(n));
    return idleName ? actions[idleName] ?? null : null;
  }, [actions, names]);

  useEffect(() => {
    if (idleAction) {
      idleAction.reset().fadeIn(0.3).play();
    }
  }, [idleAction]);

  /** Aplica uma clip externa ao rig e dispara com crossfade. */
  async function playClipUrl(animationUrl: string, durationMs: number) {
    if (!mixer || !groupRef.current) return;
    let action = externalActionsRef.current.get(animationUrl);
    if (!action) {
      try {
        const clips = await loadClips(animationUrl);
        const clip = clips[0];
        if (!clip) return;
        action = mixer.clipAction(clip, groupRef.current);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        externalActionsRef.current.set(animationUrl, action);
      } catch {
        // Animação ainda não existe — silenciosamente ignora.
        return;
      }
    }
    const prev = currentActionRef.current;
    if (prev && prev !== action) prev.fadeOut(0.25);
    if (idleAction && idleAction !== action) idleAction.fadeOut(0.25);
    action.reset().fadeIn(0.25).play();
    currentActionRef.current = action;

    // Quando o sinal terminar, volta suavemente para idle.
    const back = window.setTimeout(() => {
      if (currentActionRef.current === action) {
        action!.fadeOut(0.3);
        if (idleAction) idleAction.reset().fadeIn(0.3).play();
        currentActionRef.current = null;
      }
    }, durationMs + 100);
    return () => window.clearTimeout(back);
  }

  // Bus pub/sub: troca animações em tempo real.
  useEffect(() => {
    return subscribeLia((evt) => {
      const sign = evt.sign ?? getSign(evt.gloss);
      const dur = sign?.durationMs ?? 1000;
      // Prioridade 1: clip por URL específica do gloss.
      if (sign?.animationUrl) {
        playClipUrl(sign.animationUrl, dur);
        return;
      }
      // Prioridade 2: action embutida no GLB com mesmo nome do gloss.
      const name = names.find((n) => n.toUpperCase() === evt.gloss.toUpperCase());
      const action = name ? actions[name] : null;
      if (action && mixer) {
        const prev = currentActionRef.current;
        if (prev && prev !== action) prev.fadeOut(0.25);
        if (idleAction && idleAction !== action) idleAction.fadeOut(0.25);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.reset().fadeIn(0.25).play();
        currentActionRef.current = action;
        window.setTimeout(() => {
          if (currentActionRef.current === action) {
            action.fadeOut(0.3);
            if (idleAction) idleAction.reset().fadeIn(0.3).play();
            currentActionRef.current = null;
          }
        }, dur + 100);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, names, mixer, idleAction]);

  // Respiração leve do conjunto (cosmético, independente do mixer).
  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(performance.now() / 1000) * 0.015;
    // Pequena rotação ambiente quando nada está tocando
    if (!currentActionRef.current && !idleAction) {
      groupRef.current.rotation.y += dt * 0.1;
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={gltf.scene} />
    </group>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Placeholder — usado quando o GLB do avatar ainda não foi entregue.
 * Reage a playSign() com um leve bounce para provar que o pub/sub vive.
 * ────────────────────────────────────────────────────────────── */
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
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshStandardMaterial color="#f4d3b8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, -0.05]}>
        <sphereGeometry args={[0.4, 48, 48, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
        <meshStandardMaterial color="#3a1f12" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.05, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.6, 8, 24]} />
        <meshStandardMaterial color="#c9a8ff" roughness={0.7} />
      </mesh>
      <mesh position={[-0.11, 0.58, 0.3]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#2a1810" />
      </mesh>
      <mesh position={[0.11, 0.58, 0.3]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#2a1810" />
      </mesh>
      <Html center position={[0, -0.95, 0]}>
        <span className="rounded-full bg-card/80 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur">
          coloque o avatar em <code className="font-mono">/public/models/lia.glb</code>
        </span>
      </Html>
    </group>
  );
}
