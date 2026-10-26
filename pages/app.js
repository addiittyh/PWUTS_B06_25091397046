$(function () {
  const $content = $("#pageContent");
  const $title = $("#pageTitle");
  const homeHTML = $content.html();
  const roomData = buildRoomData();
  let activeRoom = null;

  function getFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem("ruangkitaFavorites") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveFavorites(list) {
    localStorage.setItem("ruangkitaFavorites", JSON.stringify(list));
    updateFavoriteWidgets();
  }

  function updateFavoriteWidgets() {
    const favorites = getFavorites();
    $("#favCountHome").text(favorites.length);
    $("#favoriteCount").text(favorites.length);

    const $preview = $("#favoritePreview");
    if (!$preview.length) return;
    $preview.empty();

    if (!favorites.length) {
      $preview.append($("<p>", {
        text: "Belum ada ruang favorit. Simpan ruang melalui menu Ketersediaan Ruang."
      }));
      return;
    }

    favorites.slice(0, 3).forEach(id => {
      const room = roomData.find(item => item.id === id);
      if (!room) return;
      $preview.append(
        $("<span>", { class: "favorite-preview-chip" })
          .append($("<b>", { text: room.id }))
          .append($("<small>", { text: room.capacity + " orang" }))
      );
    });

    if (favorites.length > 3) {
      $preview.append($("<small>", {
        class: "favorite-more",
        text: "+" + (favorites.length - 3) + " ruang lainnya"
      }));
    }
  }

  function buildRoomData() {
    const result = [];
    for (let building = 1; building <= 10; building++) {
      for (let floor = 1; floor <= 10; floor++) {
        for (let number = 1; number <= 10; number++) {
          const id = "K" + building + "." + String(floor).padStart(2, "0") + "." + String(number).padStart(2, "0");
          const seed = building * 11 + floor * 7 + number * 13;
          const capacity = 20 + (seed % 17) * 5;
          const minimum = 1 + (seed % 10);
          const facilities = ["AC"];
          if (seed % 2 === 0) facilities.push("Papan tulis");
          if (seed % 3 !== 0) facilities.push("Proyektor");
          if (seed % 4 === 0) facilities.push("Komputer");
          if (seed % 5 === 0) facilities.push("Wi-Fi");
          result.push({ id, building, floor, number, capacity, minimum, facilities, seed });
        }
      }
    }
    return result;
  }

  function localDateString(date = new Date()) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function roomStatus(room, date, start, end) {
    // Data status adalah simulasi deterministik, bukan jadwal kampus sebenarnya.
    // Kode pertama dan terakhir sengaja tersedia sebagai batas rentang contoh.
    if (room.id === "K1.01.01" || room.id === "K10.10.10") return "available";
    const maintenanceSeed = room.building * 13 + room.floor * 7 + room.number * 3;
    if (maintenanceSeed % 47 === 0) return "maintenance";

    const day = date ? Number(date.slice(-2)) : 1;
    const bookingSeed = (room.building * 3 + room.floor * 5 + room.number * 7 + day) % 9;
    const startMinutes = toMinutes(start || "08:00");
    const endMinutes = toMinutes(end || "10:00");
    const busyStart = bookingSeed % 2 === 0 ? 9 * 60 : 13 * 60;
    const busyEnd = busyStart + 120;
    if (bookingSeed < 3 && startMinutes < busyEnd && endMinutes > busyStart) return "occupied";
    return "available";
  }

  function toMinutes(time) {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return 0;
    const parts = time.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function statusLabel(status) {
    return status === "available" ? "Tersedia" : status === "occupied" ? "Terjadwal" : "Maintenance";
  }

  function updateDashboardStats() {
    const date = localDateString();
    const available = roomData.filter(room => roomStatus(room, date, "08:00", "10:00") === "available").length;
    const $stats = $(".stat-value");
    if ($stats.length >= 2) {
      $stats.eq(0).text("1.000");
      $stats.eq(1).text(available.toLocaleString("id-ID"));
    }
    updateFavoriteWidgets();
  }

  function showHome(pushState = true) {
    $content.removeClass("loaded-subpage").html(homeHTML);
    $title.text("Dashboard");
    $(".nav-link").removeClass("active");
    $('.nav-link[data-page="home"]').addClass("active");
    $("#sidebar").removeClass("open");
    if (pushState) {
      try {
        history.pushState({ home: true }, "", location.pathname);
      } catch (error) {
        // Saat dibuka sebagai file lokal, tampilan tetap berjalan tanpa riwayat SPA.
      }
    }
    updateDashboardStats();
    const now = new Date();
    const dateText = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
    $("#todayDate").text(dateText.charAt(0).toUpperCase() + dateText.slice(1));
  }

  function showPage(url, title, pushState = true) {
    const templateId = url.includes("ruangan.html")
      ? "roomsTemplate"
      : url.includes("booking.html")
        ? "bookingTemplate"
        : null;

    const template = templateId
      ? document.getElementById(templateId)
      : null;

    if (!template) {
      $content.html(
        '<div class="panel"><h2>Halaman tidak ditemukan</h2>' +
        '<p class="muted">Periksa pilihan menu pada dashboard.</p></div>'
      );
      $title.text("Halaman tidak ditemukan");
      return;
    }

    $content
      .addClass("loaded-subpage")
      .html(template.innerHTML)
      .removeClass("is-loading");

    $title.text(title);
    $(".nav-link").removeClass("active");
    $('.nav-link[href="' + url + '"]').addClass("active");

    if (pushState) {
      try {
        history.pushState({ url: url, title: title }, "", "#" + url);
      } catch (error) {
        // Fallback aman untuk browser yang membatasi History API pada file lokal.
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    initializePage(url);
  }

  $(document).on("click", '[data-page="home"]', function (e) {
    e.preventDefault();
    showHome();
  });

  $(document).on("click", ".ajax-link", function (e) {
    e.preventDefault();
    const url = $(this).attr("href");
    showPage(url, $(this).data("title") || $(this).text().trim());
    $("#sidebar").removeClass("open");
  });

  $(document).on("submit", "#dashboardRoomSearch", function (e) {
    e.preventDefault();
    const query = $("#dashboardSearchInput").val().trim();
    sessionStorage.setItem("roomSearchQuery", query);
    showPage("pages/ruangan.html", "Ketersediaan Ruang");
  });

  $(document).on("click", "#dashboardFavoritesLink", function () {
    sessionStorage.setItem("openFavoritesOnly", "true");
  });

  $(document).on("click", "#returnHome", function () { showHome(); });
  $(window).on("popstate", function (e) {
    const state = e.originalEvent.state;
    if (state && state.url) showPage(state.url, state.title, false);
    else showHome(false);
  });
  $("#mobileMenu").on("click", function () { $("#sidebar").toggleClass("open"); });

  function initializePage(url) {
    if (url.indexOf("ruangan.html") >= 0) initRooms();
    if (url.indexOf("booking.html") >= 0) initBooking();
  }

  function getRoomById(id) {
    return roomData.find(room => room.id === id) || null;
  }

  function initRooms() {
    let currentPage = 1;
    const pageSize = 5;
    const today = localDateString();
    $("#filterDate").attr("min", today).val(today);
    const dashboardQuery = sessionStorage.getItem("roomSearchQuery") || "";
    sessionStorage.removeItem("roomSearchQuery");
    let favoritesOnly = sessionStorage.getItem("openFavoritesOnly") === "true";
    sessionStorage.removeItem("openFavoritesOnly");
    $("#roomSearch").val(dashboardQuery);
    $("#filterBuilding, #filterCapacity").val("");
    $("#filterStatus").val("available");
    $("#favoritesOnly").toggleClass("active", favoritesOnly);
    activeRoom = null;

    function getFilteredRooms() {
      const date = $("#filterDate").val() || today;
      const start = $("#filterStart").val() || "08:00";
      const end = $("#filterEnd").val() || "10:00";
      const building = $("#filterBuilding").val();
      const capacity = Number($("#filterCapacity").val() || 0);
      const statusFilter = $("#filterStatus").val() || "available";
      const query = ($("#roomSearch").val() || "").trim().toUpperCase();

      return roomData.filter(room => {
        const status = roomStatus(room, date, start, end);
        const statusMatches = statusFilter === "all" || status === statusFilter;
        return (!building || room.building === Number(building)) &&
          room.capacity >= capacity &&
          (!query || room.id.includes(query) || ("GEDUNG K" + room.building).includes(query)) &&
          statusMatches &&
          (!favoritesOnly || getFavorites().includes(room.id));
      });
    }

    function renderPagination(totalPages) {
      const $nav = $("#roomPagination").empty();
      const addButton = (label, page, disabled = false, selected = false) => {
        const $button = $("<button>", {
          type: "button",
          class: "page-button" + (selected ? " selected" : ""),
          text: label,
          disabled: disabled
        });
        if (page !== null) $button.attr("data-page-number", page);
        $nav.append($button);
      };
      addButton("Previous", currentPage - 1, currentPage === 1);
      const pages = new Set([1, 2, 3, 4, 5, totalPages, currentPage - 1, currentPage, currentPage + 1]);
      const sorted = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
      let previous = 0;
      sorted.forEach(p => {
        if (previous && p - previous > 1) $nav.append('<span class="page-ellipsis">…</span>');
        addButton(String(p), p, false, p === currentPage);
        previous = p;
      });
      addButton("Next", currentPage + 1, currentPage === totalPages || totalPages === 0);
    }

    function renderTable() {
      const rows = getFilteredRooms();
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      currentPage = Math.min(currentPage, totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const pageRows = rows.slice(startIndex, startIndex + pageSize);
      const $tbody = $("#roomTableBody").empty();

      if (!pageRows.length) {
        $tbody.html('<tr><td colspan="5" class="table-empty">Tidak ada ruang yang cocok. Coba ubah kata kunci, waktu, atau filter.</td></tr>');
      } else {
        pageRows.forEach(room => {
          const status = roomStatus(room, $("#filterDate").val(), $("#filterStart").val(), $("#filterEnd").val());
          const $tr = $("<tr>");
          $tr.append($("<td>").append(
            $("<div>", { class: "room-name", text: room.id }),
            $("<small>", { class: "room-building-label", text: "Gedung K" + room.building + " · Lantai " + room.floor })
          ));
          $tr.append($("<td>", { class: "numeric-cell", text: room.capacity + " orang" }));
          $tr.append($("<td>", { class: "numeric-cell", text: room.minimum + " orang" }));
          $tr.append($("<td>").append($("<span>", { class: "table-status " + status, text: statusLabel(status) })));
          const $actions = $("<div>", { class: "table-actions" });
          const isFavorite = getFavorites().includes(room.id);
          $actions.append($("<button>", {
            type: "button",
            class: "action-btn favorite-room" + (isFavorite ? " is-favorite" : ""),
            text: isFavorite ? "★ Favorit" : "☆ Favorit",
            title: isFavorite ? "Hapus dari favorit" : "Simpan sebagai favorit"
          }).attr("data-room", room.id));
          $actions.append($("<button>", { type: "button", class: "action-btn detail-room", text: "Detail" }).attr("data-room", room.id));
          $actions.append($("<button>", { type: "button", class: "action-btn photo-room", text: "Lihat Foto" }).attr("data-room", room.id));
          const $choose = $("<button>", {
            type: "button",
            class: "action-btn choose-room-table",
            text: "Pilih",
            disabled: status !== "available",
            title: status !== "available" ? "Ruang tidak tersedia pada waktu yang dipilih" : "Pilih ruang ini"
          }).attr("data-room", room.id);
          $actions.append($choose);
          $tr.append($("<td>").append($actions));
          $tbody.append($tr);
        });
      }
      $("#resultCount").text("Menampilkan " + pageRows.length + " dari " + rows.length.toLocaleString("id-ID") + " ruang yang cocok");
      $("#tableTotal").text("Total: " + rows.length.toLocaleString("id-ID") + " data");
      $("#favoriteCount").text(getFavorites().length);
      renderPagination(totalPages);
    }

    $("#favoritesOnly").off("click.favorites").on("click.favorites", function () {
      favoritesOnly = !favoritesOnly;
      $(this).toggleClass("active", favoritesOnly);
      $(this).html((favoritesOnly ? "★ Favorit saya " : "☆ Favorit saya ") +
        '<span id="favoriteCount">' + getFavorites().length + '</span>');
      currentPage = 1;
      renderTable();
    });

    $(document).off("click.favoriteRoom", ".favorite-room").on("click.favoriteRoom", ".favorite-room", function () {
      const id = $(this).attr("data-room");
      const favorites = getFavorites();
      const updated = favorites.includes(id)
        ? favorites.filter(item => item !== id)
        : [...favorites, id];
      saveFavorites(updated);
      renderTable();
      $("#roomNotice").text(updated.includes(id)
        ? "Ruang " + id + " ditambahkan ke favorit."
        : "Ruang " + id + " dihapus dari favorit.");
    });

    $("#resetRoomFilters").off("click.resetRooms").on("click.resetRooms", function () {
      $("#filterDate").val(today);
      $("#filterStart").val("08:00");
      $("#filterEnd").val("10:00");
      $("#filterBuilding, #filterCapacity").val("");
      $("#filterStatus").val("available");
      $("#roomSearch").val("");
      favoritesOnly = false;
      $("#favoritesOnly").removeClass("active").html('☆ Favorit saya <span id="favoriteCount">' + getFavorites().length + '</span>');
      currentPage = 1;
      $("#roomNotice").text("Filter telah direset.");
      renderTable();
    });

    $("#exportRooms").off("click.exportRooms").on("click.exportRooms", function () {
      const rows = getFilteredRooms();
      const csvRows = [["Kode Ruang", "Gedung", "Lantai", "Kapasitas", "Minimum Peserta", "Fasilitas", "Status"]];
      rows.forEach(room => csvRows.push([
        room.id,
        "Gedung K" + room.building,
        room.floor,
        room.capacity,
        room.minimum,
        room.facilities.join("; "),
        statusLabel(roomStatus(room, $("#filterDate").val(), $("#filterStart").val(), $("#filterEnd").val()))
      ]));
      const csv = "\uFEFF" + csvRows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(",")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ruangkita-ruangan-filter.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      $("#roomNotice").text("Ekspor selesai: " + rows.length.toLocaleString("id-ID") + " ruang diekspor ke CSV.");
    });

    $("#roomFilter").on("submit", function (e) {
      e.preventDefault();
      const start = $("#filterStart").val(), end = $("#filterEnd").val();
      if (!$("#filterDate").val()) {
        $("#roomNotice").text("Silakan pilih tanggal penggunaan.");
        return;
      }
      if (!start || !end || toMinutes(start) >= toMinutes(end)) {
        $("#roomNotice").text("Jam selesai harus lebih akhir daripada jam mulai.");
        return;
      }
      currentPage = 1;
      $("#roomNotice").text("Pencarian diperbarui sesuai tanggal, waktu, gedung, kapasitas, dan status yang dipilih.");
      renderTable();
    });

    $("#roomSearch").on("input", function () { currentPage = 1; renderTable(); });
    $("#filterBuilding, #filterCapacity, #filterStatus").on("change", function () { currentPage = 1; renderTable(); });
    $("#filterDate, #filterStart, #filterEnd").on("change", function () { currentPage = 1; renderTable(); });

    $("#roomPagination").on("click", "[data-page-number]", function () {
      const page = Number($(this).attr("data-page-number"));
      if (page < 1) return;
      currentPage = page;
      renderTable();
    });

    function openRoomModal(roomId, showPhoto) {
      const room = getRoomById(roomId);
      if (!room) return;
      activeRoom = room;
      const status = roomStatus(room, $("#filterDate").val(), $("#filterStart").val(), $("#filterEnd").val());
      $("#modalRoomName").text(room.id);
      $("#modalRoomLocation").text("Gedung K" + room.building + " · Lantai " + room.floor + " · Ruang " + room.number);
      $("#modalCapacity").text(room.capacity + " orang");
      $("#modalMinimum").text(room.minimum + " orang");
      $("#modalStatus").text(statusLabel(status)).attr("class", "modal-status " + status);
      $("#modalFacilities").text(room.facilities.join(", "));
      $("#modalEyebrow").text(showPhoto ? "PRATINJAU RUANG" : "INFORMASI RUANG");
      $("#photoCaption").toggle(showPhoto);
      $("#modalIllustration").toggleClass("photo-mode", showPhoto).show();
      $("#modalChooseRoom").prop("disabled", status !== "available").toggle(status === "available");
      $("#roomModal").prop("hidden", false);
      $("body").addClass("modal-open");
    }

    $(document).off("click.rooms", ".detail-room").on("click.rooms", ".detail-room", function () { openRoomModal($(this).attr("data-room"), false); });
    $(document).off("click.rooms", ".photo-room").on("click.rooms", ".photo-room", function () { openRoomModal($(this).attr("data-room"), true); });
    $(document).off("click.rooms", ".choose-room-table").on("click.rooms", ".choose-room-table", function () {
      const room = getRoomById($(this).attr("data-room"));
      if (!room) return;
      sessionStorage.setItem("selectedRoom", room.id);
      sessionStorage.setItem("selectedRoomDate", $("#filterDate").val());
      sessionStorage.setItem("selectedRoomStart", $("#filterStart").val());
      sessionStorage.setItem("selectedRoomEnd", $("#filterEnd").val());
      showPage("pages/booking.html", "Ajukan Booking");
    });
    $("#modalChooseRoom").on("click", function () {
      if (!activeRoom) return;
      sessionStorage.setItem("selectedRoom", activeRoom.id);
      sessionStorage.setItem("selectedRoomDate", $("#filterDate").val());
      sessionStorage.setItem("selectedRoomStart", $("#filterStart").val());
      sessionStorage.setItem("selectedRoomEnd", $("#filterEnd").val());
      $("#roomModal").prop("hidden", true);
      $("body").removeClass("modal-open");
      showPage("pages/booking.html", "Ajukan Booking");
    });
    $("#roomModal").on("click", "[data-close-modal]", function () {
      $("#roomModal").prop("hidden", true);
      $("body").removeClass("modal-open");
    });

    renderTable();
  }

  function initBooking() {
    const today = localDateString();
    $("#bookingDate").attr("min", today).val(today);
    $("#roomName").empty().append($("<option>", { value: "", text: "Pilih ruang kelas" }));
    for (let building = 1; building <= 10; building++) {
      const $group = $("<optgroup>", { label: "Gedung K" + building });
      roomData.filter(room => room.building === building).forEach(room => {
        $group.append($("<option>", { value: room.id, text: room.id + " — " + room.capacity + " orang" }));
      });
      $("#roomName").append($group);
    }

    function updateBookingPreview() {
      const roomId = $("#roomName").val();
      const room = getRoomById(roomId);
      const date = $("#bookingDate").val();
      const start = $("#startTime").val();
      const end = $("#endTime").val();
      const purpose = $("#purpose").val();
      const participants = $("#participants").val();

      $("#bookingPreview .preview-content").text(
        (roomId ? "Ruang: " + roomId + (room ? " (kapasitas " + room.capacity + " orang)" : "") : "Ruang belum dipilih") +
        " · Tanggal: " + (date || "belum dipilih") +
        " · Waktu: " + (start || "--:--") + "–" + (end || "--:--") +
        " · Tujuan: " + (purpose || "belum dipilih") +
        " · Peserta: " + (participants || "belum diisi")
      );
      $("#notesCounter").text($("#notes").val().length + "/300 karakter");
    }

    $("#bookingForm").off("input.preview change.preview")
      .on("input.preview change.preview", "input, select, textarea", updateBookingPreview);
    updateBookingPreview();

    const selected = sessionStorage.getItem("selectedRoom");
    if (selected) $("#roomName").val(selected);
    const selectedDate = sessionStorage.getItem("selectedRoomDate");
    if (selectedDate && selectedDate >= today) $("#bookingDate").val(selectedDate);
    const selectedStart = sessionStorage.getItem("selectedRoomStart");
    const selectedEnd = sessionStorage.getItem("selectedRoomEnd");
    if (selectedStart) $("#startTime").val(selectedStart);
    if (selectedEnd) $("#endTime").val(selectedEnd);
    updateBookingPreview();

    $("#bookingForm").off("reset").on("reset", function () {
      setTimeout(function () {
        $(".field-error").text("");
        $("#formAlert").removeClass("error success").text("");
        $("#bookingResult").prop("hidden", true);
        $("#bookingDate").val(today);
        updateBookingPreview();
      }, 0);
    });

    $("#bookingForm").off("submit").on("submit", function (e) {
      e.preventDefault();
      $(".field-error").text("");
      $("#formAlert").removeClass("error success").text("");
      $("#bookingResult").prop("hidden", true);
      const errors = [];
      function error(id, message) {
        $('.field-error[data-for="' + id + '"]').text(message);
        errors.push(message);
      }
      const name = $("#bookerName").val().trim();
      const email = $("#bookerEmail").val().trim();
      const roomId = $("#roomName").val();
      const purpose = $("#purpose").val();
      const date = $("#bookingDate").val();
      const participants = Number($("#participants").val());
      const start = $("#startTime").val(), end = $("#endTime").val();
      if (name.length < 3) error("bookerName", "Nama minimal 3 karakter.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error("bookerEmail", "Masukkan alamat email yang valid.");
      if (!roomId) error("roomName", "Pilih ruang terlebih dahulu.");
      if (!purpose) error("purpose", "Pilih tujuan penggunaan.");
      if (!date || date < today) error("bookingDate", "Tanggal tidak boleh sebelum hari ini.");
      if (!Number.isInteger(participants) || participants < 1 || participants > 200) error("participants", "Jumlah peserta harus 1–200 orang.");
      if (!start) error("startTime", "Pilih waktu mulai.");
      if (!end) error("endTime", "Pilih waktu selesai.");
      if (start && end && toMinutes(start) >= toMinutes(end)) error("endTime", "Waktu selesai harus setelah waktu mulai.");

      const room = getRoomById(roomId);
      if (room && date && start && end && toMinutes(start) < toMinutes(end)) {
        const status = roomStatus(room, date, start, end);
        if (status !== "available") error("roomName", "Ruang " + roomId + " berstatus " + statusLabel(status).toLowerCase() + " pada tanggal/waktu tersebut. Pilih waktu atau ruang lain.");
        if (participants > room.capacity) error("participants", "Jumlah peserta melebihi kapasitas ruang (" + room.capacity + " orang).");
      }

      if (errors.length) {
        $("#formAlert").addClass("error").text("Pengajuan belum dapat diproses. Periksa " + errors.length + " kesalahan pada formulir.");
        return;
      }

      const bookingCode = "BK-" + Date.now().toString().slice(-6);
      $("#formAlert").addClass("success").text("Validasi berhasil. Ini simulasi pada browser; belum ada penyimpanan database.");
      $("#bookingResult").prop("hidden", false).html(
        "<b>✓ Formulir lolos validasi</b><br>" +
        "Kode simulasi: <b>" + escapeHtml(bookingCode) + "</b><br>" +
        "Pemesan: " + escapeHtml(name) + "<br>" +
        "Ruang: " + escapeHtml(roomId) + " · Tanggal: " + escapeHtml(date) + "<br>" +
        "Tujuan: " + escapeHtml(purpose) + "<br>" +
        "Waktu: " + escapeHtml(start) + "–" + escapeHtml(end) + " · Peserta: " + participants + "<br>" +
        "Status simulasi: <b>Submitted</b>. Data belum dikirim atau disimpan ke server/database."
      );
      $("#bookingResult")[0].scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char];
    });
  }

  updateDashboardStats();
  updateFavoriteWidgets();
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  $("#todayDate").text(dateText.charAt(0).toUpperCase() + dateText.slice(1));

  if (location.hash.indexOf("pages/") >= 1) {
    const url = location.hash.slice(1);
    if (url === "pages/ruangan.html") showPage(url, "Ketersediaan Ruang", false);
    if (url === "pages/booking.html") showPage(url, "Ajukan Booking", false);
  }
});
