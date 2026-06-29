# Animações por gloss

Um arquivo GLB por sinal, nomeado pelo slug do gloss:

- `ola.glb`, `tchau.glb`, `obrigado.glb`, `amor.glb`, `libras.glb`, ...

Convenção (veja `src/lib/lia-sign-library.ts`):
  SIGN_LIBRARY[gloss].animationUrl  →  /animations/<slug>.glb

Cada GLB deve conter **uma única AnimationClip** (a primeira é tocada)
endereçando o mesmo esqueleto de `/models/lia.glb`.

O loader é tolerante a falhas: se o arquivo não existir, o sinal vira
no-op e a Lia 2D segue como fallback.
