/* =========================================================
   SELVORA — HOMEPAGE UI
   ========================================================= */

/* =========================================================
   SCROLL REVEALS
========================================================= */

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });

} else {

  revealElements.forEach((element) => {
    element.classList.add("is-visible");
  });
}

/* =========================================================
   TESTIMONIAL NOTES
========================================================= */

const testimonialNotes = document.querySelectorAll(".note");

testimonialNotes.forEach((note) => {

  note.addEventListener("click", () => {

    const quote =
      note.querySelector(".note-quote")?.textContent.trim() || "";

    const meta =
      note.querySelector(".note-meta")?.textContent.trim() || "";

    if (quote) {
      alert(`${quote}${meta ? `\n\n— ${meta}` : ""}`);
    }
  });
});
