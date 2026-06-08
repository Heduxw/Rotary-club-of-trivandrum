const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");
const dropdowns = document.querySelectorAll(".dropdown");

// ─── HAMBURGER TOGGLE ───
hamburger.addEventListener("click", function (e) {
  e.stopPropagation();
  hamburger.classList.toggle("active"); // animates to X
  navMenu.classList.toggle("open"); // shows/hides menu
});

// ─── DROPDOWN TOGGLE ───
dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("click", function (e) {
    e.stopPropagation();

    const menu = this.querySelector(".dropdown-menu");

    // Close other open dropdowns
    document.querySelectorAll(".dropdown-menu.show").forEach((openMenu) => {
      if (openMenu !== menu) openMenu.classList.remove("show");
    });

    menu.classList.toggle("show");
  });
});

// ─── CLOSE EVERYTHING ON OUTSIDE CLICK ───
document.addEventListener("click", () => {
  navMenu.classList.remove("open");
  hamburger.classList.remove("active");
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    menu.classList.remove("show");
  });
});
