document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("app-sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle");

  toggleBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("show");
  });
});
