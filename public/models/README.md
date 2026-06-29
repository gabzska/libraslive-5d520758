# Modelo 3D da Lia

Coloque aqui o avatar riggado em formato GLB: **`lia.glb`**.

Requisitos do rig:
- Esqueleto humanóide padrão (Mixamo-compatible recomendado)
- Mãos com pelo menos os 15 ossos dos dedos (necessários para Libras)
- Blendshapes faciais (ARKit ou Mixamo) para expressões linguísticas
- Uma clip chamada `Idle` embutida (opcional, mas recomendado)

Enquanto o arquivo não existir, o `<Lia3DStage />` mostra um placeholder
animado e o pipeline `playSign()` segue funcionando (no-op para o rig).
