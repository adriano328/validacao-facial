//remove data:image/jpeg;base64, da imagem capturada
export function stripDataUrl(v: string) {
    if (!v) return "";
    const idx = v.indexOf("base64,");
    return idx >= 0 ? v.slice(idx + "base64,".length) : v;
  }