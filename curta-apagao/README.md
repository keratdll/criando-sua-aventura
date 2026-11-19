# O Apagão que Parou o Brasil

Curta-metragem animado 2D (vertical 9:16, 5 min 29 s) sobre fake news na família. Trabalho escolar — Senac.

- `dist/index.html` + `dist/trilha.mp3`: o curta para assistir no navegador (abra o `index.html`).
- `O-Apagao-que-Parou-o-Brasil.mp4`: o mesmo curta exportado em vídeo 1080×1920.
- `src/`: código da animação (canvas 2D): personagens, cenários, cenas e player.
- `build/roteiro.py`: roteiro com todas as falas e marcações de tempo.
- `build/tts.py`: gera as vozes (síntese neural pt-BR) com marcação de tempo de cada palavra.
- `build/build.py`: monta a linha do tempo e mixa vozes, música e efeitos em `trilha.mp3`.
- `build/bundle.py`: junta tudo em `dist/index.html`.

Para refazer: `python3 build/tts.py && python3 build/build.py && python3 build/bundle.py` (rodar dentro de `build/` os dois primeiros).
