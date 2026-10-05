/** iPhone, iPad, and iPadOS (which reports itself as a Mac with a touch screen). */
export function shouldOfferIosHomeScreen(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}
