const pageLinks = [
  ["Dashboard", "../index.html", "dashboard"],
  ["Subject Performance", "subject-performance.html", "subject-performance"],
  ["Semester Performance", "semester-performance.html", "semester-performance"],
  ["Class Analytics", "class-analytics.html", "class-analytics"],
  ["Top Performers", "top-performers.html", "top-performers"],
  ["Subject Analysis", "subject-analysis.html", "subject-analysis"],
  ["Attendance & Comparisons", "attendance-analysis.html", "attendance-analysis"],
  ["Gender Analysis", "gender-analysis.html", "gender-analysis"],
  ["Grade Distribution", "grade-distribution.html", "grade-distribution"],
  ["Department Comparison", "department-comparison.html", "department-comparison"],
  ["Marks Distribution", "marks-distribution.html", "marks-distribution"],
  ["Correlation Heatmap", "correlation-heatmap.html", "correlation-heatmap"],
  ["Compare Students", "compare-students.html", "compare-students"],
  ["Search", "search.html", "search"],
  ["Prediction", "prediction.html", "prediction"],
  ["Reports", "reports.html", "reports"],
];

const apiBases = [
  window.STUDENT_API_BASE,
  window.location.protocol.startsWith("http") ? window.location.origin : null,
  window.location.protocol.startsWith("http") ? `${window.location.protocol}//${window.location.hostname}:8001` : null,
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8001",
].filter(Boolean);

function resolveHref(href) {
  const isRoot = document.body.dataset.page === "dashboard";
  if (isRoot && href !== "../index.html") {
    return `pages/${href}`;
  }
  if (isRoot && href === "../index.html") {
    return "index.html";
  }
  return href;
}

function renderLayout() {
  const app = document.querySelector("#app");
  const currentPage = document.body.dataset.page || "dashboard";
  const title = document.body.dataset.title || "Dashboard";

  const navItems = pageLinks
    .map(([label, href, key]) => {
      const activeClass = key === currentPage ? " active" : "";
      return `<li><a class="nav-link${activeClass}" href="${resolveHref(href)}">${label}</a></li>`;
    })
    .join("");

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <h1 class="brand-title">Student Performance Analytics</h1>
          <p class="brand-subtitle">Foundation dashboard</p>
        </div>
        <ul class="nav-list">${navItems}</ul>
      </aside>
      <main class="main">
        <header class="topbar">
          <h2 class="page-title">${title}</h2>
          <span class="status-pill" id="api-status">API status pending</span>
        </header>
        <section class="content" id="page-content"></section>
      </main>
    </div>
  `;

  if (currentPage === "dashboard") {
    renderDashboard();
  } else if (currentPage === "class-analytics") {
    renderClassAnalytics();
  } else if (currentPage === "attendance-analysis") {
    renderAttendanceComparisons();
  } else if (currentPage === "compare-students") {
    renderCompareStudents();
  } else if (currentPage === "prediction") {
    renderPredictionPage();
  } else {
    renderComingSoon(title);
  }
}

function renderComingSoon(title) {
  document.querySelector("#page-content").innerHTML = `
    <div class="panel">
      <h2>${title}</h2>
      <p>Coming soon. This page is reserved in the navigation and file structure so future feature work can slot into the existing foundation.</p>
    </div>
  `;
  checkApiStatus();
}

async function renderDashboard() {
  const content = document.querySelector("#page-content");
  content.innerHTML = `
    <div class="metric-grid">
      <div class="metric"><div class="metric-label">Students</div><div class="metric-value" id="student-count">--</div></div>
      <div class="metric"><div class="metric-label">Departments</div><div class="metric-value" id="department-count">--</div></div>
      <div class="metric"><div class="metric-label">Average CGPA</div><div class="metric-value" id="average-cgpa">--</div></div>
      <div class="metric"><div class="metric-label">Average Attendance</div><div class="metric-value" id="average-attendance">--</div></div>
    </div>
    <div class="dashboard-grid">
      <section class="panel search-panel">
        <div class="panel-heading">
          <h2>Student Profile Search</h2>
        </div>
        <form class="search-form" id="student-search-form">
          <input id="student-search-input" type="search" placeholder="Search by roll number or name" autocomplete="off">
          <button class="button" type="submit">Search</button>
        </form>
        <div class="search-results" id="search-results"></div>
        <div class="profile-card empty-state" id="student-profile">Search for a student to view the full profile.</div>
      </section>
      <section class="panel">
        <div class="panel-heading">
          <h2>Filters</h2>
        </div>
        <div id="filters-root"></div>
      </section>
    </div>
    <section class="panel table-panel">
      <div class="panel-heading table-heading">
        <h2>Students</h2>
        <span class="result-count" id="filtered-count">0 results</span>
      </div>
      <div class="table-wrap">
        <table class="students-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Gender</th>
              <th>CGPA</th>
              <th>Attendance</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody id="students-table-body"></tbody>
        </table>
      </div>
      <div class="empty-state hidden" id="students-empty">No students match these filters.</div>
    </section>
  `;

  try {
    const payload = await fetchApi("/api/students?limit=500");

    document.querySelector("#api-status").textContent = "API connected";
    updateDashboardMetrics(payload.data);
    renderStudentsTable(payload.data);
    setupStudentSearch();
    renderStudentFilters(document.querySelector("#filters-root"), applyStudentFilters);
  } catch (error) {
    document.querySelector("#api-status").textContent = "API unavailable";
    content.insertAdjacentHTML(
      "beforeend",
      `<div class="panel" style="margin-top:18px"><h2>Connection note</h2><p>${error.message}</p></div>`
    );
  }
}

function setupStudentSearch() {
  const form = document.querySelector("#student-search-form");
  const input = document.querySelector("#student-search-input");
  const results = document.querySelector("#search-results");
  const profile = document.querySelector("#student-profile");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    results.innerHTML = "";

    if (!query) {
      profile.className = "profile-card empty-state";
      profile.textContent = "Enter a roll number or name to search.";
      return;
    }

    try {
      const payload = await fetchApi(`/api/students/search?q=${encodeURIComponent(query)}&limit=8`);
      if (!payload.data.length) {
        profile.className = "profile-card empty-state";
        profile.textContent = "No student found for that search.";
        return;
      }

      renderSearchResults(payload.data);
      renderStudentProfile(payload.data[0]);
    } catch (error) {
      profile.className = "profile-card empty-state";
      profile.textContent = error.message;
    }
  });
}

function renderSearchResults(students) {
  const results = document.querySelector("#search-results");
  results.innerHTML = students
    .map(
      (student) => `
        <button class="result-chip" type="button" data-roll-number="${student.roll_number}">
          ${student.name} <span>${student.roll_number}</span>
        </button>
      `
    )
    .join("");

  results.querySelectorAll("[data-roll-number]").forEach((button) => {
    button.addEventListener("click", async () => {
      const rollNumber = button.dataset.rollNumber;
      const payload = await fetchApi(`/api/students/${encodeURIComponent(rollNumber)}`);
      renderStudentProfile(payload.data);
    });
  });
}

function renderStudentProfile(student) {
  const profile = document.querySelector("#student-profile");
  profile.className = "profile-card";
  profile.innerHTML = `
    <div class="profile-header">
      <div>
        <h3>${student.name}</h3>
        <p>${student.roll_number}</p>
      </div>
      <span class="grade-badge">${student.grade}</span>
    </div>
    <div class="profile-stats">
      <div><span>Class</span><strong>${student.class}</strong></div>
      <div><span>Department</span><strong>${student.department}</strong></div>
      <div><span>Semester</span><strong>${student.semester}</strong></div>
      <div><span>CGPA</span><strong>${student.overall_cgpa.toFixed(2)}</strong></div>
      <div><span>Attendance</span><strong>${student.attendance_percentage.toFixed(1)}%</strong></div>
      <div><span>Overall</span><strong>${student.overall_percentage.toFixed(1)}%</strong></div>
    </div>
    <div class="subjects-list">
      <h4>Subjects</h4>
      ${student.subjects
        .map(
          (subject) => `
            <div class="subject-row">
              <span>${subject.subject_name}</span>
              <strong>${subject.total_marks.toFixed(1)}</strong>
              <small>${subject.internal_marks.toFixed(1)} internal / ${subject.external_marks.toFixed(1)} external</small>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="report-actions">
      <button class="button" type="button" data-report-type="pdf" data-roll-number="${student.roll_number}">Download PDF Report</button>
      <button class="button secondary" type="button" data-report-type="excel" data-roll-number="${student.roll_number}">Download Excel Report</button>
    </div>
  `;

  profile.querySelectorAll("[data-report-type]").forEach((button) => {
    button.addEventListener("click", () => {
      downloadStudentReport(button.dataset.rollNumber, button.dataset.reportType);
    });
  });
}

async function downloadStudentReport(rollNumber, reportType) {
  const extension = reportType === "pdf" ? "pdf" : "xlsx";
  const endpoint = reportType === "pdf" ? "pdf" : "excel";
  const filename = `${rollNumber}_report.${extension}`;
  const blob = await fetchApiBlob(`/api/reports/${encodeURIComponent(rollNumber)}/${endpoint}`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function applyStudentFilters(filters) {
  const params = new URLSearchParams({ limit: "500" });
  Object.entries(filters).forEach(([key, value]) => params.set(key, value));

  try {
    const payload = await fetchApi(`/api/students?${params.toString()}`);
    renderStudentsTable(payload.data);
  } catch (error) {
    document.querySelector("#students-table-body").innerHTML = "";
    document.querySelector("#students-empty").classList.remove("hidden");
    document.querySelector("#students-empty").textContent = error.message;
  }
}

async function checkApiStatus() {
  try {
    const payload = await fetchApi("/health");
    document.querySelector("#api-status").textContent = payload.success ? "API connected" : "API unavailable";
  } catch {
    document.querySelector("#api-status").textContent = "API unavailable";
  }
}

async function renderClassAnalytics() {
  const content = document.querySelector("#page-content");
  content.innerHTML = `
    <section class="panel analytics-filter-panel">
      <div class="panel-heading">
        <h2>Scope</h2>
        <span class="result-count" id="analytics-scope-label">All students</span>
      </div>
      <div id="analytics-filters-root"></div>
    </section>
    <div class="metric-grid">
      <div class="metric"><div class="metric-label">Average Marks</div><div class="metric-value" id="class-average-marks">--</div></div>
      <div class="metric"><div class="metric-label">Median Marks</div><div class="metric-value" id="class-median-marks">--</div></div>
      <div class="metric"><div class="metric-label">Average CGPA</div><div class="metric-value" id="class-average-cgpa">--</div></div>
      <div class="metric"><div class="metric-label">Students</div><div class="metric-value" id="class-student-count">--</div></div>
    </div>
    <div class="analytics-grid">
      <section class="panel chart-panel">
        <div class="panel-heading">
          <h2>Marks Distribution</h2>
        </div>
        <div class="chart-frame"><canvas id="marks-histogram"></canvas></div>
      </section>
      <section class="panel chart-panel">
        <div class="panel-heading">
          <h2>Marks Box Plot</h2>
        </div>
        <div class="plot-frame" id="marks-box-plot"></div>
      </section>
    </div>
    <section class="panel chart-panel">
      <div class="panel-heading">
        <h2>Subject Analysis</h2>
      </div>
      <div class="chart-frame wide"><canvas id="subject-stats-chart"></canvas></div>
    </section>
    <section class="panel chart-panel">
      <div class="panel-heading">
        <h2>Pass / Fail</h2>
      </div>
      <div class="chart-frame"><canvas id="pass-fail-chart"></canvas></div>
    </section>
    <section class="panel chart-panel">
      <div class="panel-heading">
        <h2>Top Performers</h2>
        <div class="segmented-control" id="top-performer-limit">
          <button class="active" type="button" data-limit="5">Top 5</button>
          <button type="button" data-limit="10">Top 10</button>
        </div>
      </div>
      <div class="chart-frame wide"><canvas id="top-performers-chart"></canvas></div>
    </section>
  `;

  window.classAnalyticsState = {
    filters: {},
    topLimit: 5,
    charts: {},
  };

  setupTopPerformerToggle();
  renderStudentFilters(
    document.querySelector("#analytics-filters-root"),
    (filters) => {
      window.classAnalyticsState.filters = filters;
      updateAnalyticsScopeLabel(filters);
      loadClassAnalytics();
    },
    { visibleFields: ["department", "semester"] }
  );
}

async function renderAttendanceComparisons() {
  const content = document.querySelector("#page-content");
  content.innerHTML = `
    <section class="panel analytics-filter-panel">
      <div class="panel-heading">
        <h2>Scope</h2>
        <span class="result-count" id="comparison-scope-label">All students</span>
      </div>
      <div id="comparison-filters-root"></div>
    </section>
    <div class="analytics-grid">
      <section class="panel chart-panel">
        <div class="panel-heading">
          <h2>Overall Attendance</h2>
        </div>
        <div class="chart-frame"><canvas id="attendance-pie-chart"></canvas></div>
      </section>
      <section class="panel chart-panel">
        <div class="panel-heading">
          <h2>Monthly Attendance</h2>
        </div>
        <div class="chart-frame"><canvas id="monthly-attendance-chart"></canvas></div>
      </section>
    </div>
    <section class="panel chart-panel">
      <div class="panel-heading">
        <h2>Attendance vs Marks</h2>
      </div>
      <div class="plot-frame" id="attendance-marks-scatter"></div>
    </section>
    <div class="analytics-grid">
      <section class="panel chart-panel">
        <div class="panel-heading">
          <h2>Gender Comparison</h2>
        </div>
        <div class="chart-frame"><canvas id="gender-comparison-chart"></canvas></div>
      </section>
      <section class="panel chart-panel">
        <div class="panel-heading">
          <h2>Grade Distribution</h2>
          <div class="segmented-control" id="grade-chart-switcher">
            <button class="active" type="button" data-chart-type="pie">Pie</button>
            <button type="button" data-chart-type="bar">Bar</button>
          </div>
        </div>
        <div class="chart-frame"><canvas id="grade-distribution-chart"></canvas></div>
      </section>
    </div>
    <section class="panel chart-panel">
      <div class="panel-heading">
        <h2>Department Comparison</h2>
      </div>
      <div class="chart-frame wide"><canvas id="department-comparison-chart"></canvas></div>
    </section>
  `;

  window.attendanceComparisonState = {
    filters: {},
    gradeChartType: "pie",
    charts: {},
    latestGradeData: [],
  };

  setupChartSwitcher("#grade-chart-switcher", (chartType) => {
    window.attendanceComparisonState.gradeChartType = chartType;
    renderGradeDistributionChart(window.attendanceComparisonState.latestGradeData);
  });

  renderStudentFilters(
    document.querySelector("#comparison-filters-root"),
    (filters) => {
      window.attendanceComparisonState.filters = filters;
      updateComparisonScopeLabel(filters);
      loadAttendanceComparisons();
    },
    { visibleFields: ["department", "semester"] }
  );
}

function setupChartSwitcher(selector, onChange) {
  document.querySelectorAll(`${selector} button`).forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(`${selector} button`).forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      onChange(button.dataset.chartType);
    });
  });
}

function updateComparisonScopeLabel(filters) {
  const parts = [];
  if (filters.department) {
    parts.push(filters.department);
  }
  if (filters.semester) {
    parts.push(`Semester ${filters.semester}`);
  }
  document.querySelector("#comparison-scope-label").textContent = parts.length ? parts.join(" / ") : "All students";
}

async function loadAttendanceComparisons() {
  try {
    document.querySelector("#api-status").textContent = "API connected";
    await Promise.all([
      loadAttendanceAnalytics(),
      loadGenderComparison(),
      loadGradeDistribution(),
      loadDepartmentComparison(),
    ]);
  } catch (error) {
    document.querySelector("#api-status").textContent = "API unavailable";
    console.error(error);
  }
}

function comparisonQuery() {
  const params = new URLSearchParams();
  Object.entries(window.attendanceComparisonState.filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadAttendanceAnalytics() {
  const payload = await fetchApi(`/api/analytics/attendance${comparisonQuery()}`);
  renderAttendancePieChart(payload.data.overall_attendance_percentage);
  renderMonthlyAttendanceChart(payload.data.monthly_trend);
  renderAttendanceMarksScatter(payload.data.attendance_vs_marks);
}

async function loadGenderComparison() {
  const payload = await fetchApi(`/api/analytics/gender-comparison${comparisonQuery()}`);
  renderGenderComparisonChart(payload.data);
}

async function loadGradeDistribution() {
  const payload = await fetchApi(`/api/analytics/grade-distribution${comparisonQuery()}`);
  window.attendanceComparisonState.latestGradeData = payload.data;
  renderGradeDistributionChart(payload.data);
}

async function loadDepartmentComparison() {
  const payload = await fetchApi(`/api/analytics/department-comparison${comparisonQuery()}`);
  renderDepartmentComparisonChart(payload.data);
}

function destroyComparisonChart(key) {
  const chart = window.attendanceComparisonState.charts[key];
  if (chart) {
    chart.destroy();
  }
}

function renderAttendancePieChart(overallAttendance) {
  destroyComparisonChart("attendancePie");
  window.attendanceComparisonState.charts.attendancePie = new Chart(document.querySelector("#attendance-pie-chart"), {
    type: "pie",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [overallAttendance, Math.max(0, 100 - overallAttendance)],
        backgroundColor: ["#0f9f6e", "#d9e2ec"],
      }],
    },
    options: pieOptions(),
  });
}

function renderMonthlyAttendanceChart(monthlyTrend) {
  destroyComparisonChart("monthlyAttendance");
  window.attendanceComparisonState.charts.monthlyAttendance = new Chart(document.querySelector("#monthly-attendance-chart"), {
    type: "bar",
    data: {
      labels: monthlyTrend.map((item) => item.month),
      datasets: [{
        label: "Attendance %",
        data: monthlyTrend.map((item) => item.average_attendance),
        backgroundColor: "#246bfe",
      }],
    },
    options: {
      ...chartOptions("Month", "Attendance %"),
      scales: {
        x: { title: { display: true, text: "Month" } },
        y: { beginAtZero: true, max: 100, title: { display: true, text: "Attendance %" } },
      },
    },
  });
}

function renderAttendanceMarksScatter(pairs) {
  Plotly.react(
    "attendance-marks-scatter",
    [{
      x: pairs.map((item) => item.attendance_percentage),
      y: pairs.map((item) => item.overall_percentage),
      text: pairs.map((item) => `${item.name} (${item.roll_number})`),
      mode: "markers",
      type: "scatter",
      marker: { color: "#246bfe", size: 9, opacity: 0.78 },
      hovertemplate: "%{text}<br>Attendance: %{x:.1f}%<br>Marks: %{y:.1f}%<extra></extra>",
    }],
    {
      margin: { t: 10, r: 24, b: 52, l: 52 },
      xaxis: { title: "Attendance %", range: [0, 100] },
      yaxis: { title: "Overall marks %", range: [0, 100] },
    },
    { responsive: true, displayModeBar: false }
  );
}

function renderGenderComparisonChart(rows) {
  destroyComparisonChart("genderComparison");
  window.attendanceComparisonState.charts.genderComparison = new Chart(document.querySelector("#gender-comparison-chart"), {
    type: "bar",
    data: {
      labels: rows.map((item) => item.gender),
      datasets: [
        {
          label: "Average marks",
          data: rows.map((item) => item.average_marks),
          backgroundColor: "#246bfe",
        },
        {
          label: "Average attendance",
          data: rows.map((item) => item.average_attendance),
          backgroundColor: "#0f9f6e",
        },
        {
          label: "Pass %",
          data: rows.map((item) => item.pass_percentage),
          backgroundColor: "#d9822b",
        },
      ],
    },
    options: {
      ...chartOptions("Gender", "Percent"),
      scales: {
        x: { title: { display: true, text: "Gender" } },
        y: { beginAtZero: true, max: 100, title: { display: true, text: "Percent" } },
      },
    },
  });
}

function renderGradeDistributionChart(rows) {
  destroyComparisonChart("gradeDistribution");
  const chartType = window.attendanceComparisonState.gradeChartType;
  window.attendanceComparisonState.charts.gradeDistribution = new Chart(document.querySelector("#grade-distribution-chart"), {
    type: chartType,
    data: {
      labels: rows.map((item) => item.grade),
      datasets: [{
        label: "Students",
        data: rows.map((item) => item.count),
        backgroundColor: ["#0f9f6e", "#246bfe", "#d9822b", "#7c3aed", "#d92d20"],
      }],
    },
    options: chartType === "pie" ? pieOptions() : chartOptions("Grade", "Students"),
  });
}

async function renderCompareStudents() {
  const content = document.querySelector("#page-content");
  content.innerHTML = `
    <div class="compare-grid">
      <section class="panel">
        <div class="panel-heading">
          <h2>Student 1</h2>
        </div>
        <div id="compare-picker-1"></div>
      </section>
      <section class="panel">
        <div class="panel-heading">
          <h2>Student 2</h2>
        </div>
        <div id="compare-picker-2"></div>
      </section>
    </div>
    <section class="panel chart-panel">
      <div class="panel-heading">
        <h2>Subject Marks Radar</h2>
        <span class="result-count" id="compare-status">Pick two students</span>
      </div>
      <div class="chart-frame wide"><canvas id="student-radar-chart"></canvas></div>
    </section>
    <section class="panel table-panel">
      <div class="panel-heading">
        <h2>Side-by-Side Details</h2>
      </div>
      <div id="comparison-table-root" class="empty-state">Comparison details will appear after both students are selected.</div>
    </section>
  `;

  window.compareStudentsState = {
    student1: null,
    student2: null,
    radarChart: null,
  };

  setupStudentPicker("compare-picker-1", "student1");
  setupStudentPicker("compare-picker-2", "student2");
  checkApiStatus();
}

function setupStudentPicker(containerId, stateKey) {
  const container = document.querySelector(`#${containerId}`);
  container.innerHTML = `
    <form class="search-form compare-search-form">
      <input type="search" placeholder="Search by roll number or name" autocomplete="off">
      <button class="button" type="submit">Search</button>
    </form>
    <div class="search-results"></div>
    <div class="selected-student empty-state">No student selected.</div>
  `;

  const form = container.querySelector("form");
  const input = container.querySelector("input");
  const results = container.querySelector(".search-results");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    results.innerHTML = "";
    if (!query) {
      return;
    }

    const payload = await fetchApi(`/api/students/search?q=${encodeURIComponent(query)}&limit=6`);
    results.innerHTML = payload.data
      .map(
        (student) => `
          <button class="result-chip" type="button" data-roll-number="${student.roll_number}">
            ${student.name} <span>${student.roll_number}</span>
          </button>
        `
      )
      .join("");

    results.querySelectorAll("[data-roll-number]").forEach((button) => {
      button.addEventListener("click", async () => {
        const studentPayload = await fetchApi(`/api/students/${encodeURIComponent(button.dataset.rollNumber)}`);
        selectComparisonStudent(container, stateKey, studentPayload.data);
      });
    });

    if (payload.data.length === 1) {
      selectComparisonStudent(container, stateKey, payload.data[0]);
    }
  });
}

function selectComparisonStudent(container, stateKey, student) {
  window.compareStudentsState[stateKey] = student;
  container.querySelector(".selected-student").className = "selected-student selected-card";
  container.querySelector(".selected-student").innerHTML = `
    <strong>${student.name}</strong>
    <span>${student.roll_number}</span>
    <small>${student.department} / Semester ${student.semester}</small>
  `;
  maybeLoadStudentComparison();
}

async function maybeLoadStudentComparison() {
  const { student1, student2 } = window.compareStudentsState;
  if (!student1 || !student2) {
    return;
  }

  const payload = await fetchApi(
    `/api/comparisons?roll1=${encodeURIComponent(student1.roll_number)}&roll2=${encodeURIComponent(student2.roll_number)}`
  );
  document.querySelector("#compare-status").textContent = `${student1.roll_number} vs ${student2.roll_number}`;
  renderRadarChart("student-radar-chart", payload.data.radar, window.compareStudentsState, "radarChart");
  renderComparisonTable(payload.data);
}

function renderRadarChart(canvasId, radarData, state, chartKey) {
  if (state[chartKey]) {
    state[chartKey].destroy();
  }

  state[chartKey] = new Chart(document.querySelector(`#${canvasId}`), {
    type: "radar",
    data: {
      labels: radarData.labels,
      datasets: [
        {
          label: radarData.datasets[0].label,
          data: radarData.datasets[0].data,
          borderColor: "#246bfe",
          backgroundColor: "rgba(36, 107, 254, 0.18)",
          pointBackgroundColor: "#246bfe",
        },
        {
          label: radarData.datasets[1].label,
          data: radarData.datasets[1].data,
          borderColor: "#0f9f6e",
          backgroundColor: "rgba(15, 159, 110, 0.18)",
          pointBackgroundColor: "#0f9f6e",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20 },
        },
      },
    },
  });
}

function renderComparisonTable(comparison) {
  const root = document.querySelector("#comparison-table-root");
  const student1 = comparison.student1;
  const student2 = comparison.student2;
  root.className = "table-wrap";
  root.innerHTML = `
    <table class="students-table comparison-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>${student1.name}<br><span>${student1.roll_number}</span></th>
          <th>${student2.name}<br><span>${student2.roll_number}</span></th>
        </tr>
      </thead>
      <tbody>
        ${comparison.subjects
          .map(
            (subject) => `
              <tr>
                <td>${subject.subject_name}</td>
                <td>${formatMarks(subject.student1_marks)}</td>
                <td>${formatMarks(subject.student2_marks)}</td>
              </tr>
            `
          )
          .join("")}
        <tr>
          <td>Attendance</td>
          <td>${comparison.summary.attendance.student1.toFixed(1)}%</td>
          <td>${comparison.summary.attendance.student2.toFixed(1)}%</td>
        </tr>
        <tr>
          <td>CGPA</td>
          <td>${comparison.summary.cgpa.student1.toFixed(2)}</td>
          <td>${comparison.summary.cgpa.student2.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Overall Percentage</td>
          <td>${comparison.summary.overall_percentage.student1.toFixed(1)}%</td>
          <td>${comparison.summary.overall_percentage.student2.toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>
  `;
}

function formatMarks(value) {
  return value === null || value === undefined ? "Not enrolled" : value.toFixed(1);
}

async function renderPredictionPage() {
  const content = document.querySelector("#page-content");
  content.innerHTML = `
    <section class="panel prediction-panel">
      <div class="panel-heading">
        <h2>CGPA Prediction</h2>
      </div>
      <form class="prediction-form" id="prediction-form">
        <label class="field">
          <span>Attendance %</span>
          <input name="attendance" type="number" min="0" max="100" step="0.1" value="80" required>
        </label>
        <label class="field">
          <span>Average Internal Marks</span>
          <input name="internal_marks" type="number" min="0" max="30" step="0.1" value="22" required>
        </label>
        <label class="field">
          <span>Average Assignment / External Marks</span>
          <input name="assignment_marks" type="number" min="0" max="70" step="0.1" value="52" required>
        </label>
        <div class="filter-actions">
          <button class="button" type="submit">Predict CGPA</button>
        </div>
      </form>
    </section>
    <section class="panel prediction-result-panel">
      <div id="prediction-result" class="empty-state">Enter values and submit to estimate CGPA.</div>
    </section>
  `;

  setupPredictionForm();
  checkApiStatus();
}

function setupPredictionForm() {
  const form = document.querySelector("#prediction-form");
  const result = document.querySelector("#prediction-result");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const params = new URLSearchParams({
      attendance: formData.get("attendance"),
      internal_marks: formData.get("internal_marks"),
      assignment_marks: formData.get("assignment_marks"),
    });

    try {
      const payload = await fetchApi(`/api/predict?${params.toString()}`);
      renderPredictionResult(payload.data);
    } catch (error) {
      result.className = "empty-state";
      result.textContent = error.message;
    }
  });
}

function renderPredictionResult(prediction) {
  const result = document.querySelector("#prediction-result");
  result.className = "prediction-result";
  result.innerHTML = `
    <div class="prediction-score">
      <span>Predicted CGPA</span>
      <strong>${prediction.predicted_cgpa.toFixed(2)}</strong>
    </div>
    <div class="profile-stats prediction-stats">
      <div><span>Model R2</span><strong>${Number(prediction.r2_score).toFixed(3)}</strong></div>
      <div><span>Training Rows</span><strong>${prediction.training_rows}</strong></div>
      <div><span>Attendance</span><strong>${Number(prediction.inputs.attendance).toFixed(1)}%</strong></div>
      <div><span>Internal Avg</span><strong>${Number(prediction.inputs.internal_marks).toFixed(1)}</strong></div>
      <div><span>Assignment Avg</span><strong>${Number(prediction.inputs.assignment_marks).toFixed(1)}</strong></div>
    </div>
    <p class="caveat">This is an estimate based on limited fake training data. It is useful for testing the analytics flow, not a guarantee of real academic performance.</p>
  `;
}

function renderDepartmentComparisonChart(rows) {
  destroyComparisonChart("departmentComparison");
  window.attendanceComparisonState.charts.departmentComparison = new Chart(document.querySelector("#department-comparison-chart"), {
    type: "bar",
    data: {
      labels: rows.map((item) => item.department),
      datasets: [{
        label: "Average CGPA",
        data: rows.map((item) => item.average_cgpa),
        backgroundColor: "#246bfe",
      }],
    },
    options: {
      ...chartOptions("Department", "Average CGPA"),
      scales: {
        x: { title: { display: true, text: "Department" } },
        y: { beginAtZero: true, max: 10, title: { display: true, text: "Average CGPA" } },
      },
    },
  });
}

function setupTopPerformerToggle() {
  document.querySelectorAll("#top-performer-limit button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#top-performer-limit button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      window.classAnalyticsState.topLimit = Number(button.dataset.limit);
      loadTopPerformers();
    });
  });
}

function updateAnalyticsScopeLabel(filters) {
  const parts = [];
  if (filters.department) {
    parts.push(filters.department);
  }
  if (filters.semester) {
    parts.push(`Semester ${filters.semester}`);
  }
  document.querySelector("#analytics-scope-label").textContent = parts.length ? parts.join(" / ") : "All students";
}

async function loadClassAnalytics() {
  try {
    document.querySelector("#api-status").textContent = "API connected";
    await Promise.all([loadClassStats(), loadSubjectStats(), loadPassFailStats(), loadTopPerformers()]);
  } catch (error) {
    document.querySelector("#api-status").textContent = "API unavailable";
    console.error(error);
  }
}

function analyticsQuery(extra = {}) {
  const params = new URLSearchParams();
  Object.entries({ ...window.classAnalyticsState.filters, ...extra }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadClassStats() {
  const payload = await fetchApi(`/api/analytics/class-stats${analyticsQuery()}`);
  const stats = payload.data;

  document.querySelector("#class-average-marks").textContent = `${stats.marks.average.toFixed(1)}%`;
  document.querySelector("#class-median-marks").textContent = `${stats.marks.median.toFixed(1)}%`;
  document.querySelector("#class-average-cgpa").textContent = stats.cgpa.average.toFixed(2);
  document.querySelector("#class-student-count").textContent = stats.count;

  renderMarksHistogram(stats.marks_distribution);
  renderMarksBoxPlot(stats.marks_distribution);
}

async function loadSubjectStats() {
  const payload = await fetchApi(`/api/analytics/subject-stats${analyticsQuery()}`);
  renderSubjectStatsChart(payload.data);
}

async function loadTopPerformers() {
  const limit = window.classAnalyticsState.topLimit;
  const payload = await fetchApi(`/api/analytics/top-performers${analyticsQuery({ limit })}`);
  renderTopPerformersChart(payload.data);
}

async function loadPassFailStats() {
  const payload = await fetchApi(`/api/analytics/pass-fail${analyticsQuery()}`);
  renderPassFailChart(payload.data);
}

function destroyChart(key) {
  const chart = window.classAnalyticsState.charts[key];
  if (chart) {
    chart.destroy();
  }
}

function renderMarksHistogram(marks) {
  destroyChart("marksHistogram");
  const bins = buildHistogramBins(marks, 10, 0, 100);
  window.classAnalyticsState.charts.marksHistogram = new Chart(document.querySelector("#marks-histogram"), {
    type: "bar",
    data: {
      labels: bins.map((bin) => bin.label),
      datasets: [{
        label: "Students",
        data: bins.map((bin) => bin.count),
        backgroundColor: "#246bfe",
      }],
    },
    options: chartOptions("Marks range", "Students"),
  });
}

function renderMarksBoxPlot(marks) {
  Plotly.react(
    "marks-box-plot",
    [{
      x: marks,
      type: "box",
      name: "Overall Marks",
      marker: { color: "#0f9f6e" },
      boxmean: true,
      orientation: "h",
    }],
    {
      margin: { t: 10, r: 20, b: 42, l: 28 },
      xaxis: { title: "Overall marks %" },
    },
    { responsive: true, displayModeBar: false }
  );
}

function renderSubjectStatsChart(subjects) {
  destroyChart("subjectStats");
  window.classAnalyticsState.charts.subjectStats = new Chart(document.querySelector("#subject-stats-chart"), {
    type: "bar",
    data: {
      labels: subjects.map((subject) => subject.subject_name),
      datasets: [
        {
          label: "Average",
          data: subjects.map((subject) => subject.average_marks),
          backgroundColor: "#246bfe",
        },
        {
          label: "Highest",
          data: subjects.map((subject) => subject.highest_marks),
          backgroundColor: "#0f9f6e",
        },
        {
          label: "Lowest",
          data: subjects.map((subject) => subject.lowest_marks),
          backgroundColor: "#d9822b",
        },
      ],
    },
    options: chartOptions("Subject", "Marks"),
  });
}

function renderTopPerformersChart(students) {
  destroyChart("topPerformers");
  window.classAnalyticsState.charts.topPerformers = new Chart(document.querySelector("#top-performers-chart"), {
    type: "bar",
    data: {
      labels: students.map((student) => `${student.name} (${student.roll_number})`),
      datasets: [{
        label: "Overall CGPA",
        data: students.map((student) => student.overall_cgpa),
        backgroundColor: "#7c3aed",
      }],
    },
    options: {
      ...chartOptions("CGPA", "Student"),
      indexAxis: "y",
      scales: {
        x: { beginAtZero: true, max: 10, title: { display: true, text: "CGPA" } },
        y: { title: { display: false } },
      },
    },
  });
}

function renderPassFailChart(passFail) {
  destroyChart("passFail");
  window.classAnalyticsState.charts.passFail = new Chart(document.querySelector("#pass-fail-chart"), {
    type: "pie",
    data: {
      labels: [`Pass (${passFail.pass_count})`, `Fail (${passFail.fail_count})`],
      datasets: [{
        data: [passFail.pass_percentage, passFail.fail_percentage],
        backgroundColor: ["#0f9f6e", "#d92d20"],
      }],
    },
    options: pieOptions(),
  });
}

function buildHistogramBins(values, binSize, min, max) {
  const bins = [];
  for (let start = min; start < max; start += binSize) {
    const end = start + binSize;
    bins.push({
      start,
      end,
      label: `${start}-${end}`,
      count: 0,
    });
  }

  values.forEach((value) => {
    const index = Math.min(Math.floor((value - min) / binSize), bins.length - 1);
    if (index >= 0) {
      bins[index].count += 1;
    }
  });

  return bins;
}

function chartOptions(xTitle, yTitle) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
    },
    scales: {
      x: { title: { display: true, text: xTitle } },
      y: { beginAtZero: true, title: { display: true, text: yTitle } },
    },
  };
}

function pieOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
    },
  };
}

async function fetchApi(path) {
  let lastError;
  for (const apiBase of apiBases) {
    try {
      const response = await fetch(`${apiBase}${path}`);
      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.message);
      }
      return payload;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchApiBlob(path) {
  let lastError;
  for (const apiBase of apiBases) {
    try {
      const response = await fetch(`${apiBase}${path}`);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function updateDashboardMetrics(students) {
  const departments = new Set(students.map((student) => student.department));
  const averageCgpa = average(students.map((student) => student.overall_cgpa));
  const averageAttendance = average(students.map((student) => student.attendance_percentage));

  document.querySelector("#student-count").textContent = students.length;
  document.querySelector("#department-count").textContent = departments.size;
  document.querySelector("#average-cgpa").textContent = averageCgpa.toFixed(2);
  document.querySelector("#average-attendance").textContent = `${averageAttendance.toFixed(1)}%`;
}

function renderStudentsTable(students) {
  const tableBody = document.querySelector("#students-table-body");
  const empty = document.querySelector("#students-empty");
  const count = document.querySelector("#filtered-count");

  count.textContent = `${students.length} ${students.length === 1 ? "result" : "results"}`;
  empty.classList.toggle("hidden", students.length > 0);
  tableBody.innerHTML = students
    .map(
      (student) => `
        <tr>
          <td>${student.roll_number}</td>
          <td>${student.name}</td>
          <td>${student.department}</td>
          <td>${student.semester}</td>
          <td>${student.gender}</td>
          <td>${student.overall_cgpa.toFixed(2)}</td>
          <td>${student.attendance_percentage.toFixed(1)}%</td>
          <td>${student.grade}</td>
        </tr>
      `
    )
    .join("");
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

document.addEventListener("DOMContentLoaded", renderLayout);
