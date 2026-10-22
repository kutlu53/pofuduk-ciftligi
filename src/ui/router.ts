export type Screen = (root: HTMLElement) => void | Promise<void>;

const root = document.getElementById("app") as HTMLElement;

export function go(screen: Screen): void {
  root.innerHTML = "";
  root.scrollTop = 0;
  window.scrollTo(0, 0);
  void screen(root);
}
