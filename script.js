(() => {
  const STORAGE_KEYS = {
    messages: "mia-preview-messages-v1",
    profile: "mia-preview-user-profile-v1"
  };

  const pages = {
    chat: { id: "page-chat", title: "Переписка" },
    diary: { id: "page-diary", title: "Дневник Мии" },
    "user-profile": { id: "page-user-profile", title: "Мой профиль" },
    "mia-profile": { id: "page-mia-profile", title: "Профиль Мии" }
  };

  const navButtons = [...document.querySelectorAll("[data-page]")];
  const pageCrumb = document.getElementById("page-crumb");
  const sidebar = document.getElementById("sidebar");
  const toast = document.getElementById("toast");
  let toastTimeout;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function openPage(pageName) {
    if (!pages[pageName]) return;
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    document.getElementById(pages[pageName].id).classList.add("active");
    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle("active", button.dataset.page === pageName);
    });
    pageCrumb.textContent = pages[pageName].title;
    sidebar.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navButtons.forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.page));
  });

  document.getElementById("mobile-menu").addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", event => {
    if (window.innerWidth <= 680 && sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) && !event.target.closest("#mobile-menu")) {
      sidebar.classList.remove("open");
    }
  });

  const messagesContainer = document.getElementById("messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  function timeLabel(date = new Date()) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  function addMessage({ sender, text, time = timeLabel(), save = true }) {
    const row = document.createElement("div");
    row.className = `message-row ${sender === "user" ? "user-row" : "mia-row"}`;

    if (sender !== "user") {
      const avatar = document.createElement("div");
      avatar.className = "message-avatar";
      avatar.textContent = "м";
      row.appendChild(avatar);
    }

    const content = document.createElement("div");
    content.className = "message-content";
    const meta = document.createElement("div");
    meta.className = "message-meta";
    const name = document.createElement("span");
    name.textContent = sender === "user" ? "Ты" : "Миа";
    const timestamp = document.createElement("span");
    timestamp.textContent = time;
    meta.append(name, timestamp);

    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender === "user" ? "user-bubble" : "mia-bubble"}`;
    // Используем textContent, чтобы пользовательский текст не интерпретировался как HTML.
    bubble.textContent = text;
    content.append(meta, bubble);
    row.appendChild(content);
    messagesContainer.appendChild(row);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if (save) saveMessages();
  }

  function getSavedMessages() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || "null");
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }

  function saveMessages() {
    const all = [...messagesContainer.querySelectorAll(".message-row")].map(row => {
      const isUser = row.classList.contains("user-row");
      const bubble = row.querySelector(".bubble");
      const time = row.querySelector(".message-meta span:last-child");
      return {
        sender: isUser ? "user" : "mia",
        text: bubble?.textContent || "",
        time: time?.textContent || timeLabel()
      };
    });
    try {
      localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(all));
    } catch {
      showToast("Не удалось сохранить переписку в этом браузере.");
    }
  }

  function loadMessages() {
    const saved = getSavedMessages();
    if (!saved) {
      saveMessages();
      return;
    }
    messagesContainer.innerHTML = '<div class="date-divider"><span>история переписки</span></div>';
    saved.forEach(message => addMessage({ ...message, save: false }));
  }

  chatForm.addEventListener("submit", event => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage({ sender: "user", text });
    chatInput.value = "";
    chatInput.style.height = "auto";
    showToast("Сообщение сохранено.");

    // Временный ответ-заглушка вместо настоящего ИИ.
    window.setTimeout(() => {
      addMessage({
        sender: "mia",
        text: "хехе, я пока ещё не умею отвечать самостоятельно 🙈\nно скоро мы подключим ИИ, и тогда я смогу по-настоящему общаться с тобой ♡"
      });
    }, 650);
  });

  chatInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 140)}px`;
  });

  document.getElementById("clear-chat").addEventListener("click", () => {
    const shouldClear = window.confirm("Очистить сохранённую переписку в этом браузере?");
    if (!shouldClear) return;
    messagesContainer.innerHTML = '<div class="date-divider"><span>начало истории</span></div>';
    addMessage({
      sender: "mia",
      text: "хей, привет :3\\nэто предварительная версия — скоро подключим ИИ и я смогу отвечать сама ♡"
    });
    showToast("Переписка очищена.");
  });

  const profileForm = document.getElementById("user-profile-form");
  const profileFields = {
    name: document.getElementById("user-name"),
    pronouns: document.getElementById("user-pronouns"),
    interests: document.getElementById("user-interests"),
    about: document.getElementById("user-about")
  };

  function loadProfile() {
    try {
      const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.profile) || "{}");
      Object.entries(profileFields).forEach(([key, field]) => {
        field.value = typeof profile[key] === "string" ? profile[key] : "";
      });
    } catch {
      // Если сохранённые данные повреждены, форма просто останется пустой.
    }
  }

  profileForm.addEventListener("submit", event => {
    event.preventDefault();
    const profile = Object.fromEntries(
      Object.entries(profileFields).map(([key, field]) => [key, field.value.trim()])
    );
    try {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
      document.getElementById("profile-feedback").textContent = "Профиль сохранён в этом браузере.";
      showToast("Профиль сохранён.");
    } catch {
      document.getElementById("profile-feedback").textContent = "Не удалось сохранить данные.";
    }
  });

  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");
  const diaryEntry = document.querySelector(".diary-entry");
  const diaryEmpty = document.getElementById("diary-empty");

  document.getElementById("filter-diary").addEventListener("click", () => {
    if (dateFrom.value && dateTo.value && dateFrom.value > dateTo.value) {
      showToast("Начальная дата не может быть позже конечной.");
      return;
    }
    const date = diaryEntry.dataset.date;
    const matchesFrom = !dateFrom.value || date >= dateFrom.value;
    const matchesTo = !dateTo.value || date <= dateTo.value;
    const matches = matchesFrom && matchesTo;
    diaryEntry.classList.toggle("hidden", !matches);
    diaryEmpty.classList.toggle("hidden", matches);
  });

  document.getElementById("reset-diary").addEventListener("click", () => {
    dateFrom.value = "";
    dateTo.value = "";
    diaryEntry.classList.remove("hidden");
    diaryEmpty.classList.add("hidden");
  });

  loadMessages();
  loadProfile();
})();
