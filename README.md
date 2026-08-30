# Quire

A private writing room that thinks on this device.

Stories stay in the browser. The language model downloads once, then writes offline — no account, no cloud, no draft leaving the phone.

## Models

Two **abliterated** GGUF instruct weights, run in WebAssembly via [wllama](https://github.com/ngxson/wllama):

| Model | Weight | Size |
| --- | --- | --- |
| Pocket | Qwen 2.5 0.5B Instruct abliterated | 398 MB |
| Desk | Llama 3.2 1B Instruct abliterated | 955 MB |

Pocket is the phone default. Desk is the heavier writer for revision and next-beat work. Download on Wi-Fi; after that the app works without a network.

These are small on-device models. They are best at continuing a scene in short bursts, not drafting a novel in one pass.

## Install

1. Open the app in a mobile browser (Safari or Chrome).
2. Use **Add to Home Screen**.
3. Tap **Install Pocket** and wait for the download.

The home-screen icon opens full-screen, like a native app.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a production bundle.

## What it does

- Manuscript library, local to the device
- Continue, rewrite, tighten, expand, next beats, and a free-form ask
- Draft insert / replace / copy, with undo
- PWA install and offline model cache (OPFS)

Nothing is sent to a server. The model never leaves the device.
