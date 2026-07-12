const studentFilterOptions = {
  departments: ["AI", "CSE", "IT", "ECE"],
  semesters: [1, 2, 3, 4],
  genders: ["Male", "Female"],
  subjects: [
    "Machine Learning",
    "Python",
    "Statistics",
    "Data Mining",
    "AI Ethics",
    "Data Structures",
    "Operating Systems",
    "DBMS",
    "Computer Networks",
    "Java",
    "Web Technology",
    "Cloud Computing",
    "Cyber Security",
    "Software Engineering",
    "Linux",
    "Digital Electronics",
    "Signals",
    "VLSI",
    "Microprocessors",
    "Communication Systems",
  ],
};

function renderStudentFilters(container, onChange, options = {}) {
  const visibleFields = new Set(
    options.visibleFields || [
      "department",
      "semester",
      "gender",
      "subject_name",
      "min_cgpa",
      "max_cgpa",
      "min_attendance",
      "max_attendance",
    ]
  );
  const field = (key, markup) => (visibleFields.has(key) ? markup : "");

  container.innerHTML = `
    <form class="filters-form" id="student-filters">
      ${field("department", `<label class="field">
        <span>Department</span>
        <select name="department">
          <option value="">All departments</option>
          ${studentFilterOptions.departments.map((item) => `<option value="${item}">${item}</option>`).join("")}
        </select>
      </label>`)}
      ${field("semester", `<label class="field">
        <span>Semester</span>
        <select name="semester">
          <option value="">All semesters</option>
          ${studentFilterOptions.semesters.map((item) => `<option value="${item}">${item}</option>`).join("")}
        </select>
      </label>`)}
      ${field("gender", `<label class="field">
        <span>Gender</span>
        <select name="gender">
          <option value="">All genders</option>
          ${studentFilterOptions.genders.map((item) => `<option value="${item}">${item}</option>`).join("")}
        </select>
      </label>`)}
      ${field("subject_name", `<label class="field">
        <span>Subject</span>
        <select name="subject_name">
          <option value="">All subjects</option>
          ${studentFilterOptions.subjects.map((item) => `<option value="${item}">${item}</option>`).join("")}
        </select>
      </label>`)}
      ${field("min_cgpa", `<label class="field">
        <span>Min CGPA</span>
        <input name="min_cgpa" type="range" min="0" max="10" step="0.1" value="0">
        <output data-for="min_cgpa">0.0</output>
      </label>`)}
      ${field("max_cgpa", `<label class="field">
        <span>Max CGPA</span>
        <input name="max_cgpa" type="range" min="0" max="10" step="0.1" value="10">
        <output data-for="max_cgpa">10.0</output>
      </label>`)}
      ${field("min_attendance", `<label class="field">
        <span>Min Attendance</span>
        <input name="min_attendance" type="range" min="0" max="100" step="1" value="0">
        <output data-for="min_attendance">0%</output>
      </label>`)}
      ${field("max_attendance", `<label class="field">
        <span>Max Attendance</span>
        <input name="max_attendance" type="range" min="0" max="100" step="1" value="100">
        <output data-for="max_attendance">100%</output>
      </label>`)}
      <div class="filter-actions">
        <button class="button secondary" type="reset">Reset</button>
      </div>
    </form>
  `;

  const form = container.querySelector("#student-filters");
  const emitChange = () => {
    updateFilterOutputs(form);
    onChange(getStudentFilterValues(form));
  };

  form.addEventListener("input", emitChange);
  form.addEventListener("change", emitChange);
  form.addEventListener("reset", () => {
    window.setTimeout(emitChange, 0);
  });

  emitChange();
}

function updateFilterOutputs(form) {
  setFilterOutput(form, "min_cgpa", (value) => Number(value).toFixed(1));
  setFilterOutput(form, "max_cgpa", (value) => Number(value).toFixed(1));
  setFilterOutput(form, "min_attendance", (value) => `${value}%`);
  setFilterOutput(form, "max_attendance", (value) => `${value}%`);
}

function setFilterOutput(form, key, formatValue) {
  if (!form.elements[key]) {
    return;
  }
  const output = form.querySelector(`[data-for="${key}"]`);
  if (output) {
    output.textContent = formatValue(form.elements[key].value);
  }
}

function getStudentFilterValues(form) {
  const formData = new FormData(form);
  const filters = {};

  for (const [key, value] of formData.entries()) {
    if (value !== "" && !isDefaultFilterValue(key, value)) {
      filters[key] = value;
    }
  }

  return filters;
}

function isDefaultFilterValue(key, value) {
  return (
    (key === "min_cgpa" && Number(value) === 0) ||
    (key === "max_cgpa" && Number(value) === 10) ||
    (key === "min_attendance" && Number(value) === 0) ||
    (key === "max_attendance" && Number(value) === 100)
  );
}
