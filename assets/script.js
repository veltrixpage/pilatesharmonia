/* Estúdio Pilates Harmonia — interações do site (versão estática) */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Cabeçalho: sombra ao rolar + botão fixo de WhatsApp ---------- */
  var header = document.querySelector(".site-header");
  var floatBtn = document.querySelector(".float-whats");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (floatBtn) floatBtn.classList.toggle("shown", y > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu do celular ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    mobileMenu.hidden = !open;
    document.body.classList.toggle("no-scroll", open);
  }
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1060) setMenu(false);
    });
  }

  /* ---------- Animação de entrada discreta ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("revealed"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Slideshow ---------- */
  var slider = document.querySelector(".slider");
  if (slider) {
    var slides = slider.querySelectorAll(".slide");
    var dots = slider.querySelectorAll(".dot");
    var index = 0;
    var timer = null;
    var paused = false;
    var touchX = null;
    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle("active", k === index);
        if (k === index) s.removeAttribute("aria-hidden"); else s.setAttribute("aria-hidden", "true");
      });
      dots.forEach(function (d, k) {
        d.classList.toggle("active", k === index);
        d.setAttribute("aria-current", k === index ? "true" : "false");
        var fill = d.querySelector(".dot-fill");
        if (fill && k === index) { fill.style.animation = "none"; void fill.offsetWidth; fill.style.animation = ""; }
      });
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!paused) timer = setTimeout(function () { show(index + 1); }, 6000);
    }
    slider.querySelector(".slider-arrow.prev").addEventListener("click", function () { show(index - 1); });
    slider.querySelector(".slider-arrow.next").addEventListener("click", function () { show(index + 1); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); }); });
    slider.addEventListener("mouseenter", function () { paused = true; slider.classList.add("paused"); clearTimeout(timer); });
    slider.addEventListener("mouseleave", function () { paused = false; slider.classList.remove("paused"); schedule(); });
    slider.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });
    schedule();
  }

  /* ---------- Galeria: foto ampliada ---------- */
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile"));
  var lb = document.querySelector(".lightbox");
  if (tiles.length && lb) {
    var INFO_COL = 340;
    var dialog = lb.querySelector(".lb-dialog");
    var viewer = lb.querySelector(".lb-viewer");
    var stage = lb.querySelector(".lb-stage");
    var img = lb.querySelector(".lb-img");
    var counter = lb.querySelector(".lb-counter");
    var title = lb.querySelector(".lb-title");
    var desc = lb.querySelector(".lb-desc");
    var whats = lb.querySelector(".lb-whats");
    var current = 0;
    var lastFocus = null;
    var lbTouchX = null;

    function layout() {
      var t = tiles[current];
      var ratio = Number(t.dataset.w) / Number(t.dataset.h);
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var w, h;
      if (vw <= 760) {
        w = Math.round(Math.min(vw * 0.94, vh * 0.6 * ratio));
        h = Math.round(w / ratio);
        dialog.style.width = "";
        viewer.style.gridTemplateColumns = "";
        viewer.style.height = "";
        stage.style.height = h + "px";
      } else {
        var maxW = Math.min(vw * 0.94, 1440);
        var maxH = Math.min(vh * 0.88, 860);
        h = Math.round(Math.min(maxH, (maxW - INFO_COL) / ratio));
        w = Math.round(h * ratio);
        dialog.style.width = w + INFO_COL + "px";
        viewer.style.gridTemplateColumns = w + "px " + INFO_COL + "px";
        viewer.style.height = h + "px";
        stage.style.height = "";
      }
      img.style.width = w + "px";
      img.style.height = h + "px";
    }

    function render() {
      var t = tiles[current];
      img.src = t.dataset.src;
      img.alt = t.dataset.title;
      img.width = Number(t.dataset.w);
      img.height = Number(t.dataset.h);
      counter.textContent = "Foto " + (current + 1) + " de " + tiles.length;
      title.textContent = t.dataset.title;
      desc.textContent = t.dataset.desc || "";
      if (t.dataset.link) { whats.href = t.dataset.link; whats.hidden = false; } else { whats.removeAttribute("href"); whats.hidden = true; }
      layout();
      // pré-carrega a anterior e a próxima
      [current - 1, current + 1].forEach(function (n) {
        var p = new Image();
        p.src = tiles[(n + tiles.length) % tiles.length].dataset.src;
      });
    }
    function open(i) {
      current = i;
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.body.classList.add("no-scroll");
      render();
      lb.querySelector(".lb-close").focus();
    }
    function close() {
      lb.hidden = true;
      document.body.classList.remove("no-scroll");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function step(d) {
      current = (current + d + tiles.length) % tiles.length;
      render();
    }

    tiles.forEach(function (t, i) { t.addEventListener("click", function () { open(i); }); });
    lb.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", close); });
    lb.querySelectorAll(".lb-prev").forEach(function (el) { el.addEventListener("click", function () { step(-1); }); });
    lb.querySelectorAll(".lb-next").forEach(function (el) { el.addEventListener("click", function () { step(1); }); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "Tab") {
        // mantém o foco dentro da janela da foto
        var f = Array.prototype.slice.call(lb.querySelectorAll("button, a[href]")).filter(function (el) { return !el.hidden && el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    stage.addEventListener("touchstart", function (e) { lbTouchX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (lbTouchX === null) return;
      var dx = e.changedTouches[0].clientX - lbTouchX;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
      lbTouchX = null;
    });
    window.addEventListener("resize", function () { if (!lb.hidden) layout(); });
  }

  /* ---------- Compartilhamento da matéria ---------- */
  var share = document.querySelector("[data-share]");
  if (share) {
    var url = window.location.href.split("#")[0];
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(document.querySelector(".article-title").textContent);
    share.querySelector("[data-share-fb]").href = "https://www.facebook.com/sharer/sharer.php?u=" + u;
    share.querySelector("[data-share-x]").href = "https://twitter.com/intent/tweet?url=" + u + "&text=" + t;
    share.querySelector("[data-share-li]").href = "https://www.linkedin.com/sharing/share-offsite/?url=" + u;
    var feedback = share.querySelector(".share-feedback");
    share.querySelector("[data-share-copy]").addEventListener("click", function () {
      if (!navigator.clipboard) { feedback.textContent = "Não foi possível copiar. Copie o endereço da barra do navegador."; return; }
      navigator.clipboard.writeText(url).then(function () {
        feedback.textContent = "Link copiado!";
        setTimeout(function () { feedback.textContent = ""; }, 2500);
      }, function () {
        feedback.textContent = "Não foi possível copiar. Copie o endereço da barra do navegador.";
      });
    });
    var nativeBtn = share.querySelector("[data-share-native]");
    if (navigator.share && window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
      nativeBtn.hidden = false;
      nativeBtn.addEventListener("click", function () {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      });
    }
  }
})();
