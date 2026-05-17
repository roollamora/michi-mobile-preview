(function () {
  const TOKEN_KEY = "michiAdminToken";
  const STATIC_TOKEN = "static";

  const statusEl = document.getElementById("status");
  const loginCard = document.getElementById("loginCard");
  const adminPanel = document.getElementById("adminPanel");
  const logoutBtn = document.getElementById("logoutBtn");
  const deployBanner = document.getElementById("deployBanner");

  let deployMode = "static";
  let siteData = null;

  function basePath() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length > 1 && segments[0] === "michi-mobile-preview") {
      return "/" + segments[0];
    }
    return "";
  }

  function resolvePath(path) {
    if (path.startsWith("http")) return path;
    const base = basePath();
    if (path.startsWith("/")) return base + path;
    return (base ? base + "/" : "./") + path.replace(/^\.\//, "");
  }

  function token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function authHeaders(json = true) {
    const headers = { Authorization: "Bearer " + token() };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
  }

  function showStatus(message, ok = true) {
    statusEl.textContent = message;
    statusEl.className = "status " + (ok ? "ok" : "err");
  }

  function setLoggedIn(loggedIn) {
    loginCard.classList.toggle("hidden", loggedIn);
    adminPanel.classList.toggle("hidden", !loggedIn);
    logoutBtn.classList.toggle("hidden", !loggedIn);
  }

  function updateDeployBanner() {
    if (!deployBanner) return;
    if (deployMode === "api") {
      deployBanner.classList.add("hidden");
      deployBanner.textContent = "";
      return;
    }
    deployBanner.classList.remove("hidden");
    deployBanner.textContent =
      "Static hosting: saves download site-data.json. Replace data/site-data.json in the repo, commit, and push to publish. For instant saves, run python3 server.py locally.";
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Expected JSON from " + url);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  async function detectDeployMode() {
    try {
      await fetchJson(resolvePath("/api/site"), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      deployMode = "api";
    } catch (_) {
      deployMode = "static";
    }
    updateDeployBanner();
    return deployMode;
  }

  async function loadStaticData() {
    return fetchJson(resolvePath("./data/site-data.json"), { cache: "no-store" });
  }

  async function api(path, options = {}) {
    return fetchJson(resolvePath(path), options);
  }

  function fillForms(data) {
    siteData = data;
    document.getElementById("target").value = data.donations.target;
    document.getElementById("collected").value = data.donations.collected;
    document.getElementById("pending").value = data.donations.pending;
    document.getElementById("milestonesJson").value = JSON.stringify(
      data.donations.milestones || [],
      null,
      2
    );
    document.getElementById("siteName").value = data.settings.siteName || "";
    document.getElementById("goalDisplay").value = data.settings.goalDisplay || "";
    document.getElementById("ctaText").value = data.settings.ctaText || "";
    document.getElementById("readMoreText").value = data.settings.readMoreText || "";
    document.getElementById("statusUpdatesJson").value = JSON.stringify(
      data.statusUpdates || [],
      null,
      2
    );
    document.getElementById("heroTitleHtml").value = data.content?.heroTitleHtml || "";
    document.getElementById("greetingHtml").value = data.content?.greetingHtml || "";
    document.getElementById("introHtml").value = data.content?.introHtml || "";
    document.getElementById("articleHtml").value = data.content?.articleHtml || "";
    renderNewsletter(data.newsletter || []);
  }

  async function loadAdminData() {
    if (deployMode === "api" && token() && token() !== STATIC_TOKEN) {
      const data = await api("/api/site", { headers: authHeaders(false) });
      fillForms(data);
      return;
    }
    const data = await loadStaticData();
    fillForms(data);
  }

  function downloadSiteData(data) {
    const body = JSON.stringify(data, null, 2) + "\n";
    const blob = new Blob([body], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "site-data.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function persistSiteData(partial, successMessage) {
    if (deployMode === "api" && token() && token() !== STATIC_TOKEN) {
      await api("/api/site", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(partial),
      });
      await loadAdminData();
      showStatus(successMessage);
      return;
    }

    if (!siteData) await loadAdminData();
    const next = JSON.parse(JSON.stringify(siteData));
    if (partial.donations) Object.assign(next.donations, partial.donations);
    if (partial.statusUpdates) next.statusUpdates = partial.statusUpdates;
    if (partial.content) {
      next.content = next.content || {};
      Object.assign(next.content, partial.content);
    }
    if (partial.settings) {
      Object.assign(next.settings, partial.settings);
    }
    if (partial.newsletter) next.newsletter = partial.newsletter;
    siteData = next;
    downloadSiteData(next);
    showStatus(
      successMessage +
        " Downloaded site-data.json — copy to data/site-data.json, commit, and push."
    );
  }

  function renderNewsletter(list) {
    const body = document.getElementById("newsletterBody");
    body.innerHTML = "";
    list.forEach((entry) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td><input data-field="email" data-id="${entry.id}" value="${entry.email}" /></td>
          <td><input data-field="name" data-id="${entry.id}" value="${entry.name || ""}" /></td>
          <td>
            <select data-field="status" data-id="${entry.id}">
              <option value="active" ${entry.status === "active" ? "selected" : ""}>active</option>
              <option value="pending" ${entry.status === "pending" ? "selected" : ""}>pending</option>
              <option value="unsubscribed" ${entry.status === "unsubscribed" ? "selected" : ""}>unsubscribed</option>
            </select>
          </td>
          <td class="row-actions">
            <button type="button" data-action="save" data-id="${entry.id}">Save</button>
            <button type="button" class="danger" data-action="delete" data-id="${entry.id}">Delete</button>
          </td>
        `;
      body.appendChild(row);
    });
  }

  document.getElementById("loginBtn").addEventListener("click", async () => {
    try {
      const password = document.getElementById("password").value;
      await detectDeployMode();

      if (deployMode === "api") {
        const result = await api("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        localStorage.setItem(TOKEN_KEY, result.token);
      } else {
        const data = await loadStaticData();
        if (password !== data.settings?.adminPassword) {
          throw new Error("Invalid password");
        }
        localStorage.setItem(TOKEN_KEY, STATIC_TOKEN);
        fillForms(data);
      }

      setLoggedIn(true);
      await loadAdminData();
      showStatus("Signed in.");
    } catch (error) {
      showStatus(error.message, false);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      if (deployMode === "api" && token() && token() !== STATIC_TOKEN) {
        await api("/api/logout", { method: "POST", headers: authHeaders(false) });
      }
    } catch (_) {}
    localStorage.removeItem(TOKEN_KEY);
    siteData = null;
    setLoggedIn(false);
    showStatus("Signed out.");
  });

  document.getElementById("saveDonationsBtn").addEventListener("click", async () => {
    try {
      const milestones = JSON.parse(document.getElementById("milestonesJson").value || "[]");
      if (!Array.isArray(milestones)) throw new Error("Milestones must be an array.");
      await persistSiteData(
        {
          donations: {
            target: Number(document.getElementById("target").value),
            collected: Number(document.getElementById("collected").value),
            pending: Number(document.getElementById("pending").value),
            milestones,
          },
        },
        "Donations saved."
      );
    } catch (error) {
      showStatus(error.message, false);
    }
  });

  document.getElementById("saveSettingsBtn").addEventListener("click", async () => {
    try {
      const payload = {
        siteName: document.getElementById("siteName").value,
        goalDisplay: document.getElementById("goalDisplay").value,
        ctaText: document.getElementById("ctaText").value,
        readMoreText: document.getElementById("readMoreText").value,
      };
      const newPassword = document.getElementById("adminPassword").value;
      if (newPassword) payload.adminPassword = newPassword;
      await persistSiteData({ settings: payload }, "Settings saved.");
      document.getElementById("adminPassword").value = "";
    } catch (error) {
      showStatus(error.message, false);
    }
  });

  document.getElementById("saveStatusUpdatesBtn").addEventListener("click", async () => {
    try {
      const statusUpdates = JSON.parse(
        document.getElementById("statusUpdatesJson").value || "[]"
      );
      if (!Array.isArray(statusUpdates)) throw new Error("Status updates must be an array.");
      await persistSiteData({ statusUpdates }, "Status updates saved.");
    } catch (error) {
      showStatus(error.message, false);
    }
  });

  document.getElementById("saveContentBtn").addEventListener("click", async () => {
    try {
      await persistSiteData(
        {
          content: {
            heroTitleHtml: document.getElementById("heroTitleHtml").value,
            greetingHtml: document.getElementById("greetingHtml").value,
            introHtml: document.getElementById("introHtml").value,
            articleHtml: document.getElementById("articleHtml").value,
          },
        },
        "Homepage content saved."
      );
    } catch (error) {
      showStatus(error.message, false);
    }
  });

  document.getElementById("addSubscriberBtn").addEventListener("click", async () => {
    try {
      if (deployMode === "api" && token() && token() !== STATIC_TOKEN) {
        await api("/api/newsletter", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            email: document.getElementById("newEmail").value,
            name: document.getElementById("newName").value,
            status: document.getElementById("newStatus").value,
          }),
        });
        document.getElementById("newEmail").value = "";
        document.getElementById("newName").value = "";
        await loadAdminData();
        showStatus("Subscriber added.");
        return;
      }

      if (!siteData) await loadAdminData();
      const entry = {
        id: "nl-" + Math.random().toString(16).slice(2, 10),
        email: document.getElementById("newEmail").value.trim().toLowerCase(),
        name: document.getElementById("newName").value.trim(),
        status: document.getElementById("newStatus").value,
        subscribedAt: new Date().toISOString(),
      };
      if (!entry.email) throw new Error("Email required");
      siteData.newsletter = siteData.newsletter || [];
      siteData.newsletter.push(entry);
      document.getElementById("newEmail").value = "";
      document.getElementById("newName").value = "";
      renderNewsletter(siteData.newsletter);
      downloadSiteData(siteData);
      showStatus(
        "Subscriber added. Downloaded site-data.json — copy to data/site-data.json, commit, and push."
      );
    } catch (error) {
      showStatus(error.message, false);
    }
  });

  document.getElementById("newsletterBody").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    const row = button.closest("tr");
    try {
      if (deployMode === "api" && token() && token() !== STATIC_TOKEN) {
        if (action === "delete") {
          await api("/api/newsletter/" + id, {
            method: "DELETE",
            headers: authHeaders(false),
          });
          await loadAdminData();
          showStatus("Subscriber removed.");
          return;
        }
        if (action === "save") {
          const email = row.querySelector('[data-field="email"]').value;
          const name = row.querySelector('[data-field="name"]').value;
          const status = row.querySelector('[data-field="status"]').value;
          await api("/api/newsletter/" + id, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ email, name, status }),
          });
          showStatus("Subscriber updated.");
        }
        return;
      }

      if (!siteData) await loadAdminData();
      if (action === "delete") {
        siteData.newsletter = (siteData.newsletter || []).filter((e) => e.id !== id);
        renderNewsletter(siteData.newsletter);
        downloadSiteData(siteData);
        showStatus(
          "Subscriber removed. Downloaded site-data.json — copy to data/site-data.json, commit, and push."
        );
        return;
      }
      if (action === "save") {
        const entry = siteData.newsletter.find((e) => e.id === id);
        if (!entry) throw new Error("Subscriber not found");
        entry.email = row.querySelector('[data-field="email"]').value.trim().toLowerCase();
        entry.name = row.querySelector('[data-field="name"]').value.trim();
        entry.status = row.querySelector('[data-field="status"]').value;
        downloadSiteData(siteData);
        showStatus(
          "Subscriber updated. Downloaded site-data.json — copy to data/site-data.json, commit, and push."
        );
      }
    } catch (error) {
      showStatus(error.message, false);
    }
  });

  (async function init() {
    const viewSite = document.getElementById("viewSiteLink");
    if (viewSite) viewSite.setAttribute("href", resolvePath("./photoshop-text-preview.html"));

    await detectDeployMode();

    if (!token()) {
      setLoggedIn(false);
      return;
    }
    try {
      setLoggedIn(true);
      await loadAdminData();
    } catch (_) {
      localStorage.removeItem(TOKEN_KEY);
      setLoggedIn(false);
    }
  })();
})();
