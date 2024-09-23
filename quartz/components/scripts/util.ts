export function registerEscapeHandler(outsideContainer: HTMLElement | null, cb: () => void) {
  if (!outsideContainer) return
  function click(this: HTMLElement, e: HTMLElementEventMap["click"]) {
    if (e.target !== this) return
    e.preventDefault()
    e.stopPropagation()
    cb()
  }

  function esc(e: HTMLElementEventMap["keydown"]) {
    if (!e.key.startsWith("Esc")) return
    e.preventDefault()
    cb()
  }

  outsideContainer?.addEventListener("click", click)
  window.addCleanup(() => outsideContainer?.removeEventListener("click", click))
  document.addEventListener("keydown", esc)
  window.addCleanup(() => document.removeEventListener("keydown", esc))
}

export function renderThemedLinks(theme: "dark" | "light") {
  const imageExtensions = new RegExp(".(dark|light).(png|jpg|jpeg|gif|bmp|svg|webp)$")
  const imageGroups = { theme: 1, extension: 2 }
  Object.values(document.getElementsByTagName("img")).forEach((img) => {
    if (img.src.match(imageExtensions)) {
      const imageSource = img.src
      const newImg = imageExtensions.exec(imageSource)
      img.src = imageSource.replace(imageExtensions, `.${theme}.${newImg![imageGroups.extension]}`)
    }
  })
}

export function getUserPreferredColorScheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

// Have SVG images in the article adhere to the correct color scheme.
document.addEventListener("nav", (e) => {
  let theme: "dark" | "light" =
    (localStorage.getItem("theme") as "dark" | "light" | null) ?? getUserPreferredColorScheme()
  Object.values(document.getElementsByTagName("article")[0].getElementsByTagName("a")).forEach(
    (a) => {
      if (a.href.endsWith(".excalidraw")) {
        let img = document.createElement("img")
        img.src = `${a.href}.${theme}.svg`
        a.replaceWith(img)
      }
    },
  )
  renderThemedLinks(theme)
})

export function removeAllChildren(node: HTMLElement) {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

// AliasRedirect emits HTML redirects which also have the link[rel="canonical"]
// containing the URL it's redirecting to.
// Extracting it here with regex is _probably_ faster than parsing the entire HTML
// with a DOMParser effectively twice (here and later in the SPA code), even if
// way less robust - we only care about our own generated redirects after all.
const canonicalRegex = /<link rel="canonical" href="([^"]*)">/

export async function fetchCanonical(url: URL): Promise<Response> {
  const res = await fetch(`${url}`)
  if (!res.headers.get("content-type")?.startsWith("text/html")) {
    return res
  }
  // reading the body can only be done once, so we need to clone the response
  // to allow the caller to read it if it's was not a redirect
  const text = await res.clone().text()
  const [_, redirect] = text.match(canonicalRegex) ?? []
  return redirect ? fetch(`${new URL(redirect, url)}`) : res
}
