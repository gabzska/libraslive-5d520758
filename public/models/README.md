# Modelo 3D da Lia — Ready Player Me

O LibrasLive usa **Ready Player Me** como fonte oficial do avatar da Lia.

## Como plugar a Lia

1. Acesse https://readyplayer.me e crie o avatar da Lia:
   - Rosto expressivo, cabelo, roupa profissional
   - **Importante**: escolha um avatar de **corpo inteiro (full-body)** —
     essencial para animações de braços e sinalização em Libras.
2. Ao final, o RPM fornece uma URL `.glb` (ex: `https://models.readyplayer.me/6570abc123.glb`).
3. Cole a URL no arquivo `.env` do projeto:
   ```
   VITE_LIA_AVATAR_URL=https://models.readyplayer.me/6570abc123.glb
   ```
4. Recarregue a preview — a Lia real substitui o placeholder automaticamente.

O código em `src/lib/lia-config.ts` injeta os parâmetros necessários:

- `morphTargets=ARKit,Oculus+Visemes` — blendshapes faciais para expressões linguísticas
- `pose=A` — pose neutra (T-pose com braços leves para baixo)
- `textureAtlas=1024` — texturas otimizadas

## Fallback local

Se preferir hospedar o GLB no próprio projeto, coloque-o aqui como `lia.glb`
e deixe `VITE_LIA_AVATAR_URL` vazio. O rig deve ser humanóide compatível
com Mixamo (bones `LeftArm`, `RightForeArm`, etc.) para as animações
procedurais funcionarem.

## Sem GLB configurado

Enquanto nenhum avatar é fornecido, o `<Lia3DStage />` mostra um
placeholder articulado que já responde a `playSign()` e `playAnimation()` —
todo o pipeline segue funcionando, só troca a "casca" visual.
