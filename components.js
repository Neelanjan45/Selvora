/* Selvora shared navigation and footer loader */
(async function loadSelvoraComponents() {
  const components = [
    ["#site-nav", "/components/navbar.html"],
    ["#site-footer", "/components/footer.html"]
  ];

  try {
    await Promise.all(components.map(async ([selector, url]) => {
      const target = document.querySelector(selector);
      if (!target) return;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
      target.innerHTML = await response.text();
    }));

    setActiveNavigation();
    document.dispatchEvent(new CustomEvent("selvora:components-loaded"));
  } catch (error) {
    console.error("Selvora shared components could not be loaded:", error);
  }
})();

function setActiveNavigation() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/home";
  const items = document.querySelectorAll(".floating-nav-item");

  items.forEach((item) => {
    item.classList.remove("is-active");
    const href = item.getAttribute("href") || "";
    const target = href.split("#")[0];

    if (
      (path === "/home" && target === "/home" && !href.includes("#")) ||
      (path === "/fragrances" && target === "/fragrances") ||
      (path.startsWith("/fragrances/") && target === "/fragrances") ||
      (path === "/cart" && target === "/cart")
    ) {
      item.classList.add("is-active");
    }
  });
}
