export function preloadImages(urls: string[], count = 2) {
  for (let i = 0; i < Math.min(count, urls.length); i++) {
    const url = urls[i];
    const img = new Image();
    img.src = url;
  }
}
