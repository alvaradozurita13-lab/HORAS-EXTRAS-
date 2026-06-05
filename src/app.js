(function () {
  const catalogs = window.HE_CATALOGS;
  const storageKey = "horasExtrasRegistrosPreparados";
  const maxSignatureBytes = 10 * 1024 * 1024;

  const form = document.querySelector("#overtimeForm");
  const recordsList = document.querySelector("#recordsList");
  const formMessage = document.querySelector("#formMessage");
  const documentState = document.querySelector("#documentState");
  const hoursNote = document.querySelector("#hoursNote");
  const resetButton = document.querySelector("#resetButton");
  const printButton = document.querySelector("#printButton");
  const downloadJsonButton = document.querySelector("#downloadJsonButton");
  const downloadHtmlButton = document.querySelector("#downloadHtmlButton");
  const clearRecordsButton = document.querySelector("#clearRecordsButton");

  const fields = {
    employee: form.elements.employee,
    coordinator: form.elements.coordinator,
    workDate: form.elements.workDate,
    startTime: form.elements.startTime,
    endTime: form.elements.endTime,
    expectedHours: form.elements.expectedHours,
    performedFor: form.elements.performedFor,
    cr60126Mode: form.elements.cr60126Mode,
    dmimtArea: form.elements.dmimtArea,
    dmimtOther: form.elements.dmimtOther,
    ldsArea: form.elements.ldsArea,
    ldsOther: form.elements.ldsOther,
    location: form.elements.location,
    workType: form.elements.workType,
    workTypeOther: form.elements.workTypeOther,
    reason: form.elements.reason,
    compensationReason: form.elements.compensationReason,
    workerSignature: form.elements.workerSignature,
    coordinatorSignature: form.elements.coordinatorSignature
  };

  const blocks = {
    cr60126Mode: document.querySelector("#cr60126ModeBlock"),
    dmimt: document.querySelector("#dmimtBlock"),
    dmimtOther: document.querySelector("#dmimtOtherBlock"),
    lds: document.querySelector("#ldsBlock"),
    ldsOther: document.querySelector("#ldsOtherBlock"),
    workTypeOther: document.querySelector("#workTypeOtherBlock"),
    compensation: document.querySelector("#compensationBlock")
  };

  const questionNumbers = {
    dmimt: document.querySelector("[data-question-number='dmimt']"),
    lds: document.querySelector("[data-question-number='lds']"),
    location: document.querySelector("[data-question-number='location']"),
    workType: document.querySelector("[data-question-number='workType']"),
    payment: document.querySelector("[data-question-number='payment']"),
    workerSignature: document.querySelector("[data-question-number='workerSignature']"),
    coordinatorSignature: document.querySelector("[data-question-number='coordinatorSignature']")
  };

  const preview = {
    code: document.querySelector("#documentCode"),
    generatedAt: document.querySelector("#docGeneratedAt"),
    employee: document.querySelector("#docEmployee"),
    coordinator: document.querySelector("#docCoordinador"),
    date: document.querySelector("#docDate"),
    start: document.querySelector("#docStart"),
    end: document.querySelector("#docEnd"),
    expected: document.querySelector("#docExpected"),
    calculated: document.querySelector("#docCalculated"),
    performedFor: document.querySelector("#docPerformedFor"),
    cr60126Mode: document.querySelector("#docCr60126Mode"),
    dmimt: document.querySelector("#docDmimt"),
    lds: document.querySelector("#docLds"),
    location: document.querySelector("#docLocation"),
    workType: document.querySelector("#docWorkType"),
    reason: document.querySelector("#docReason"),
    payment: document.querySelector("#docPayment"),
    compensation: document.querySelector("#docCompensation"),
    workerSignatureName: document.querySelector("#workerSignatureName"),
    coordinatorSignatureName: document.querySelector("#coordinatorSignatureName"),
    workerSignatureSlot: document.querySelector("#workerSignatureSlot"),
    coordinatorSignatureSlot: document.querySelector("#coordinatorSignatureSlot"),
    workerSignaturePreview: document.querySelector("#workerSignaturePreview"),
    coordinatorSignaturePreview: document.querySelector("#coordinatorSignaturePreview"),
    tags: document.querySelector("#tagList")
  };

  let draftSeed = Date.now();
  let workerSignature = "";
  let coordinatorSignature = "";
  let lastPreparedRecord = null;

  // ========================================================
  // NUEVA FUNCIÓN: GENERADOR DE FIRMA DIGITAL CORPORATIVA
  // ========================================================
  function generarFirmaAutomatica(nombreCompleto) {
    if (!nombreCompleto || nombreCompleto.includes("Selecciona")) return "";
    
    const nombreLimpio = nombreCompleto.split('-')[0].trim();

    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.15)"; 
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(140, 110);
    ctx.bezierCurveTo(160, 15, 200, 5, 190, 65);
    ctx.bezierCurveTo(180, 110, 150, 120, 210, 30);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#0056b3"; 
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const palabras = nombreLimpio.split(" ");
    if (palabras.length >= 3) {
      const linea1 = palabras.slice(0, 2).join(" ");
      const linea2 = palabras.slice(2).join(" ");
      
      ctx.font = "bold 24px Arial, Helvetica, sans-serif";
      ctx.fillText(linea1, 10, 25);
      ctx.fillText(linea2, 10, 60);
    } else {
      ctx.font = "bold 26px Arial, Helvetica, sans-serif";
      ctx.fillText(nombreLimpio, 10, 45);
    }

    const xMeta = 225; 
    ctx.fillStyle = "#1e293b"; 
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');

    const txtFecha = `Fecha: ${año}.${mes}.${dia}`;
    const txtHora = `${horas}:${minutos}:${segundos} -05'00'`;

    ctx.font = "13px Arial, Helvetica, sans-serif";
    ctx.fillText("Firmado digitalmente", xMeta, 20);
    ctx.fillText(`por ${nombreLimpio}`, xMeta, 38);
    ctx.fillText(txtFecha, xMeta, 62);
    ctx.fillText(txtHora, xMeta, 80);

    return canvas.toDataURL('image/png');
  }

  initialize();

  function initialize() {
    populateSelect(fields.employee, catalogs.employees.map((item) => ({
      value: `${item.name} - ${item.code}`,
      label: `${item.name} - ${item.code}`,
      data: item
    })), "Selecciona al trabajador");

    populateSelect(fields.coordinator, catalogs.coordinators.map((item) => ({
      value: `${item.name} - ${item.role}`,
      label: `${item.name} - ${item.role}`,
      data: item
    })), "Selecciona al supervisor");

    populateSelect(fields.performedFor, catalogs.performedFor, "Selecciona la respuesta");
    populateSelect(fields.cr60126Mode, catalogs.cr60126Modes, "Selecciona el detalle CR 60126");
    populateSelect(fields.dmimtArea, catalogs.dmimtAreas, "Selecciona la maniobra");
    populateSelect(fields.ldsArea, catalogs.ldsAreas, "Selecciona el area LDS");
    populateSelect(fields.workType, catalogs.workTypes, "Selecciona el tipo de trabajo");

    fields.workerSignature.required = false;
    if (fields.coordinatorSignature) fields.coordinatorSignature.required = false;
    fields.workDate.valueAsDate = new Date();
    
    // CAMBIO: Hacer que el campo sea de solo lectura para que actúe estrictamente de manera automática
    if (fields.expectedHours) fields.expectedHours.readOnly = true;

    renderTagList();
    bindEvents();
    updateConditionalFields();
    updateDocument();
    renderRecords();
  }

  function bindEvents() {
    form.addEventListener("input", () => {
      autoFillExpectedHours(); // CAMBIO: Sincroniza las horas automáticas en cada input
      updateConditionalFields();
      updateDocument();
    });

    form.addEventListener("change", () => {
      autoFillExpectedHours(); // CAMBIO: Sincroniza las horas automáticas en cada cambio
      updateConditionalFields();
      updateDocument();
    });

    fields.employee.addEventListener("change", () => {
      applyEmployeeDefaults();
      if (fields.employee.value) {
        workerSignature = generarFirmaAutomatica(fields.employee.value);
        renderSignature(preview.workerSignaturePreview, preview.workerSignatureSlot, workerSignature, "Firma del trabajador");
        showMessage("Firma digital del trabajador generada automáticamente.", "ok");
      } else {
        workerSignature = "";
        renderSignature(preview.workerSignaturePreview, preview.workerSignatureSlot, workerSignature, "Firma del trabajador");
      }
      updateDocument();
    });

    fields.coordinator.addEventListener("change", () => {
      if (fields.coordinator.value) {
        coordinatorSignature = generarFirmaAutomatica(fields.coordinator.value);
        renderSignature(preview.coordinatorSignaturePreview, preview.coordinatorSignatureSlot, coordinatorSignature, "Firma del supervisor");
        showMessage("Firma digital del supervisor generada automaticamente.", "ok");
      } else {
        coordinatorSignature = "";
        renderSignature(preview.coordinatorSignaturePreview, preview.coordinatorSignatureSlot, coordinatorSignature, "Firma del supervisor");
      }
      updateDocument();
    });
    
    fields.coordinatorSignature.addEventListener("change", () => loadSignature(fields.coordinatorSignature, "coordinator"));
    form.addEventListener("submit", prepareRecord);

    resetButton.addEventListener("click", resetForm);
    printButton.addEventListener("click", () => window.print());
    downloadJsonButton.addEventListener("click", downloadJsonPackage);
    downloadHtmlButton.addEventListener("click", downloadDocumentHtml);
    clearRecordsButton.addEventListener("click", clearRecords);
  }

  // NUEVA FUNCIÓN: Calcula y asigna automáticamente la duración al campo expectedHours
  function autoFillExpectedHours() {
    const calculated = calculateHours(fields.startTime.value, fields.endTime.value);
    if (calculated !== null) {
      fields.expectedHours.value = calculated;
    } else {
      fields.expectedHours.value = "";
    }
  }

  function populateSelect(select, values, placeholder) {
    select.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);

    values.forEach((entry) => {
      const option = document.createElement("option");
      if (typeof entry === "string") {
        option.value = entry;
        option.textContent = entry;
      } else {
        option.value = entry.value;
        option.textContent = entry.label;
        Object.entries(entry.data || {}).forEach(([key, value]) => {
          option.dataset[key] = value;
        });
      }
      select.appendChild(option);
    });
  }

  function applyEmployeeDefaults() {
    const selected = fields.employee.selectedOptions[0];
    if (!selected || !selected.dataset.coordinatorCode) return;

    const matchingCoordinador = Array.from(fields.coordinator.options).find((option) => (
      option.dataset.code === selected.dataset.coordinatorCode
    ));
    if (matchingCoordinador) {
      fields.coordinator.value = matchingCoordinador.value;
      coordinatorSignature = generarFirmaAutomatica(fields.coordinator.value);
      renderSignature(preview.coordinatorSignaturePreview, preview.coordinatorSignatureSlot, coordinatorSignature, "Firma del supervisor");
      updateDocument();
    }
  }

  async function loadSignature(input, type) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      input.value = "";
      showMessage("La firma debe ser una imagen PNG, JPG o WEBP.", "error");
      return;
    }

    if (file.size > maxSignatureBytes) {
      input.value = "";
      showMessage("La firma supera los 10 MB recomendados.", "error");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    if (type === "worker") {
      workerSignature = dataUrl;
      renderSignature(preview.workerSignaturePreview, preview.workerSignatureSlot, workerSignature, "Firma del trabajador");
      showMessage("Firma del trabajador cargada correctamente.", "ok");
    } else {
      coordinatorSignature = dataUrl;
      renderSignature(preview.coordinatorSignaturePreview, preview.coordinatorSignatureSlot, coordinatorSignature, "Firma del supervisor");
      showMessage("Firma del supervisor cargada correctamente.", "ok");
    }
    updateDocument();
  }

  function updateConditionalFields() {
    const performedFor = fields.performedFor.value;
    const paymentMode = radioValue("paymentMode");
    const showCr60126Mode = performedFor === "CR 60126 - Protecciones electricas y SEDs Convencionales";
    const showDmimt = performedFor === "Maniobras";
    const showLds = performedFor === "Otras areas de LDS";
    const showDmimtOther = showDmimt && fields.dmimtArea.value === "Otras";
    const showLdsOther = showLds && fields.ldsArea.value === "Otras";
    const showWorkTypeOther = fields.workType.value === "Otras";
    const showCompensation = paymentMode === "No. Compensacion";

    toggleField(blocks.cr60126Mode, fields.cr60126Mode, showCr60126Mode);
    toggleField(blocks.dmimt, fields.dmimtArea, showDmimt);
    toggleField(blocks.dmimtOther, fields.dmimtOther, showDmimtOther);
    toggleField(blocks.lds, fields.ldsArea, showLds);
    toggleField(blocks.ldsOther, fields.ldsOther, showLdsOther);
    toggleField(blocks.workTypeOther, fields.workTypeOther, showWorkTypeOther);
    toggleField(blocks.compensation, fields.compensationReason, showCompensation);

    if (!showCr60126Mode) {
      fields.cr60126Mode.value = "";
    }
    if (!showDmimt) {
      fields.dmimtArea.value = "";
      clearOptionalField(fields.dmimtOther);
    }
    if (!showLds) {
      fields.ldsArea.value = "";
      clearOptionalField(fields.ldsOther);
    }
    if (!showWorkTypeOther) {
      clearOptionalField(fields.workTypeOther);
    }
    if (!showCompensation) {
      clearOptionalField(fields.compensationReason);
    }
    updateQuestionNumbers(showDmimt, showLds);
  }

  function toggleField(block, field, show) {
    if (!block || !field) return;
    block.hidden = !show;
    field.required = show;
  }

  function clearOptionalField(field) {
    if (field) field.value = "";
  }

  function updateQuestionNumbers(showDmimt, showLds) {
    let nextNumber = 8;
    if (showDmimt) {
      setQuestionNumber("dmimt", nextNumber++);
    }
    if (showLds) {
      setQuestionNumber("lds", nextNumber++);
    }
    location: setQuestionNumber("location", nextNumber++);
    setQuestionNumber("workType", nextNumber++);
    setQuestionNumber("payment", nextNumber++);
    setQuestionNumber("workerSignature", nextNumber++);
    setQuestionNumber("coordinatorSignature", nextNumber++);
  }

  function setQuestionNumber(key, value) {
    if (questionNumbers[key]) questionNumbers[key].textContent = value;
  }

  function updateDocument() {
    const record = buildRecord();
    preview.code.textContent = record.code;
    preview.generatedAt.textContent = record.generatedAtFormatted;
    preview.employee.textContent = record.employee || "Pendiente";
    preview.coordinator.textContent = record.coordinator || "Pendiente";
    preview.date.textContent = record.workDateFormatted || "Pendiente";
    preview.start.textContent = record.startTime || "Pendiente";
    preview.end.textContent = record.endTime || "Pendiente";
    preview.expected.textContent = record.expectedHours ? `${record.expectedHours} horas` : "Pendiente";
    if (preview.calculated) preview.calculated.textContent = record.calculatedHours ? `${record.calculatedHours} horas` : "Pendiente";
    preview.performedFor.textContent = record.performedFor || "Pendiente";
    preview.cr60126Mode.textContent = record.cr60126Mode || "No aplica";
    preview.dmimt.textContent = record.dmimtArea || "No aplica";
    preview.lds.textContent = record.ldsArea || "No aplica";
    preview.location.textContent = record.location || "Pendiente";
    preview.workType.textContent = record.workType || "Pendiente";
    if (preview.reason) preview.reason.textContent = record.reason || "Pendiente";
    preview.payment.textContent = record.paymentMode || "Pendiente";
    if (preview.compensation) preview.compensation.textContent = record.compensationReason || "No aplica";
    preview.workerSignatureName.textContent = record.employee || "Apellidos y nombres";
    preview.coordinatorSignatureName.textContent = record.coordinator || "Supervisor";
    updateHoursNote(record);
  }

  async function prepareRecord(event) {
    event.preventDefault();
    autoFillExpectedHours(); // Sincronización final preventiva antes de enviar
    updateConditionalFields();

    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage("Revisa los campos obligatorios antes de preparar el registro.", "error");
      return;
    }

    if (!workerSignature && fields.employee.value) {
      workerSignature = generarFirmaAutomatica(fields.employee.value);
      renderSignature(preview.workerSignaturePreview, preview.workerSignatureSlot, workerSignature, "Firma del trabajador");
    }

    if (!coordinatorSignature && fields.coordinator.value) {
      coordinatorSignature = generarFirmaAutomatica(fields.coordinator.value);
      renderSignature(preview.coordinatorSignaturePreview, preview.coordinatorSignatureSlot, coordinatorSignature, "Firma del supervisor");
    }

    if (!workerSignature) {
      showMessage("Selecciona un trabajador para generar su firma digital.", "error");
      return;
    }

    const record = buildRecord();
    lastPreparedRecord = withSharePointPackage(record);
    persistRecord(lastPreparedRecord);
    renderRecords();
    
    documentState.textContent = "Transmitiendo...";
    showMessage("Guardando localmente y enviando a SharePoint...", "ok");

    try {
      const enviadoExitosamente = await window.SharePointAdapter.saveRecord(record);

      if (enviadoExitosamente) {
        documentState.textContent = "Registro enviado";
        documentState.className = "document-state ok"; 
        showMessage("¡Registro guardado en SharePoint y PDF generado con éxito!", "ok");
      } else {
        documentState.textContent = "Error de envío";
        documentState.className = "document-state error";
        showMessage("Se guardó en el navegador, pero falló el envío a SharePoint. Revisa tu flujo.", "error");
      }
    } catch (error) {
      console.error("Error en la transmisión:", error);
      documentState.textContent = "Error de conexión";
      documentState.className = "document-state error";
      showMessage("No se pudo conectar con el servidor de Power Automate.", "error");
    }
  }
  
  function buildRecord() {
    const calculatedHours = calculateHours(fields.startTime.value, fields.endTime.value);
    const workType = fields.workType.value === "Otras" ? clean(fields.workTypeOther.value) : fields.workType.value;
    const paymentMode = radioValue("paymentMode");
    const performedFor = fields.performedFor.value;
    const cr60126Mode = performedFor === "CR 60126 - Protecciones electricas y SEDs Convencionales" ? fields.cr60126Mode.value : "";
    const usesManiobras = performedFor === "Maniobras";
    const record = {
      code: buildCode(fields.workDate.value),
      generatedAt: new Date().toISOString(),
      generatedAtFormatted: formatDateTime(new Date()),
      employee: fields.employee.value,
      coordinador: fields.coordinator.value,
      coordinator: fields.coordinator.value,
      workDate: fields.workDate.value,
      workDateFormatted: formatDate(fields.workDate.value),
      startTime: fields.startTime.value,
      endTime: fields.endTime.value,
      expectedHours: fields.expectedHours.value ? Number(fields.expectedHours.value) : null,
      calculatedHours,
      performedFor,
      cr60126Mode,
      dmimtArea: usesManiobras
        ? resolveArea(fields.dmimtArea.value, fieldValue(fields.dmimtOther))
        : "",
      ldsArea: performedFor === "Otras areas de LDS"
        ? resolveArea(fields.ldsArea.value, fieldValue(fields.ldsOther))
        : "",
      location: clean(fields.location.value).toUpperCase(),
      workType,
      reason: clean(fieldValue(fields.reason)),
      paymentMode,
      compensationReason: paymentMode === "No. Compensacion" ? clean(fieldValue(fields.compensationReason)) : "",
      workerSignature, 
      coordinatorSignature,
      phase: "Formulario listo para SharePoint"
    };
    record.documentHtml = buildStandaloneDocumentHtml(record);
    return record;
  }

  function withSharePointPackage(record) {
    return {
      ...record,
      sharePointPackage: window.SharePointAdapter.buildSharePointPackage(record)
    };
  }

  function resolveArea(selectedArea, otherArea) {
    return selectedArea === "Otras" ? clean(otherArea) : selectedArea;
  }

  function updateHoursNote(record) {
    hoursNote.classList.remove("ok", "warning");

    if (!record.startTime || !record.endTime) {
      hoursNote.textContent = "Completa hora inicial y final para validar la duracion.";
      return;
    }

    if (!record.calculatedHours) {
      hoursNote.textContent = "No se pudo calcular la duracion. Revisa las horas ingresadas.";
      hoursNote.classList.add("warning");
      return;
    }

    hoursNote.textContent = `Duracion calculada: ${record.calculatedHours} h.`;
    hoursNote.classList.add("ok");
  }

  function renderSignature(previewBox, documentSlot, dataUrl, label) {
    if (!dataUrl) {
      previewBox.textContent = label === "Firma del trabajador" ? "Selecciona un trabajador para generar la firma." : "Selecciona un supervisor para generar la firma.";
      documentSlot.innerHTML = `<span>${escapeHtml(label)}</span>`;
      return;
    }

    previewBox.innerHTML = `<img alt="${escapeHtml(label)} cargada" src="${dataUrl}">`;
    documentSlot.innerHTML = `<img alt="${escapeHtml(label)} en documento" src="${dataUrl}">`;
  }

  function renderTagList() {
    preview.tags.innerHTML = catalogs.contentControls.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  }

  function downloadJsonPackage() {
    const record = withSharePointPackage(buildRecord());
    downloadFile(`${record.code}-paquete-sharepoint.json`, JSON.stringify(record, null, 2), "application/json");
  }

  function downloadDocumentHtml() {
    const record = withSharePointPackage(buildRecord());
    downloadFile(`${record.code}.html`, record.documentHtml, "text/html;charset=utf-8");
  }

  function resetForm() {
    form.reset();
    draftSeed = Date.now();
    fields.workDate.valueAsDate = new Date();
    workerSignature = "";
    coordinatorSignature = "";
    lastPreparedRecord = null;
    documentState.textContent = "Borrador";
    documentState.classList.remove("ok");
    renderSignature(preview.workerSignaturePreview, preview.workerSignatureSlot, workerSignature, "Firma del trabajador");
    renderSignature(preview.coordinatorSignaturePreview, preview.coordinatorSignatureSlot, coordinatorSignature, "Firma del supervisor");
    updateConditionalFields();
    updateDocument();
    showMessage("", "");
  }

  function clearRecords() {
    localStorage.removeItem(storageKey);
    renderRecords();
    showMessage("Historial local vaciado.", "ok");
  }

  function persistRecord(record) {
    const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const summary = {
      code: record.code,
      employee: record.employee,
      coordinator: record.coordinator,
      workDateFormatted: record.workDateFormatted,
      expectedHours: record.expectedHours,
      status: record.sharePointPackage.listFields.estado,
      createdAt: record.generatedAt
    };
    records.unshift(summary);
    localStorage.setItem(storageKey, JSON.stringify(records.slice(0, 15)));
  }

  function renderRecords() {
    const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!records.length) {
      recordsList.innerHTML = "<p class='form-message'>Todavia no hay registros preparados en este navegador.</p>";
      return;
    }

    recordsList.innerHTML = records.map((record) => `
      <div class="record-item">
        <div>
          <strong>${escapeHtml(record.employee)}</strong>
          <span>${escapeHtml(record.code)} · ${escapeHtml(record.workDateFormatted)} · ${record.expectedHours || 0} h</span>
        </div>
        <span>${escapeHtml(record.status)}</span>
      </div>
    `).join("");
  }

  function buildStandaloneDocumentHtml(record) {
    const contentControls = window.SharePointAdapter.buildContentControlValues(record);
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(record.code)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 28px; color: #17211d; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 22px 0 8px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 14px; }
    th { background: #e3f3ee; text-align: left; }
    th, td { border: 1px solid #cfd9d2; padding: 9px; vertical-align: top; }
    .header { border-bottom: 2px solid #17211d; margin-bottom: 18px; padding-bottom: 12px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 38px; }
    .signature { border-bottom: 1px solid #17211d; height: 92px; display: flex; align-items: end; justify-content: center; padding-bottom: 8px; }
    .signature img { max-height: 85px; max-width: 280px; object-fit: contain; }
    .caption { text-align: center; font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FORMATO DE AUTORIZACION DE HORAS EXTRAS</h1>
    <strong>CR 60126</strong><br>
    <span>Fecha de generacion: ${escapeHtml(contentControls.FechaGeneracionDocumento)}</span><br>
    <span>Codigo: ${escapeHtml(record.code)}</span>
  </div>
  ${documentTable("1. DATOS GENERALES", [
    ["Apellidos y nombres - Codigo", contentControls.ApellidosNombresCodigo],
    ["Supervisor", contentControls.Coordinador],
    ["Dia del trabajo", contentControls.DiaTrabajo],
    ["Hora inicial", contentControls.HoraInicial],
    ["Hora final", contentControls.HoraFinal],
    ["Numero de horas extra", contentControls.NumeroAnticipadoHorasExtras]
  ])}
  ${documentTable("2. DESTINO Y AREA", [
    ["Horas extras realizadas para", contentControls.HorasExtrasRealizadasPara],
    ["Detalle CR 60126", contentControls.DetalleCR60126],
    ["Maniobras", contentControls.Maniobras],
    ["Areas de LDS", contentControls.AreasLDS],
    ["Alimentador", contentControls.UbicacionGeografica],
    ["Tipo de trabajo", contentControls.TipoTrabajo]
  ])}
  ${documentTable("3. MODALIDAD DE LAS HORAS EXTRAS", [
    ["Modalidad de reconocimiento", contentControls.ModalidadDeReconocimiento]
  ])}
  <h2>4. FIRMAS</h2>
  <div class="signatures">
    <div>
      <div class="signature">${record.workerSignature ? `<img src="${record.workerSignature}" alt="Firma del trabajador">` : ""}</div>
      <p class="caption">${escapeHtml(record.employee || "Firma del trabajador")}</p>
    </div>
    <div>
      <div class="signature">${record.coordinatorSignature ? `<img src="${record.coordinatorSignature}" alt="Firma del supervisor">` : ""}</div>
      <p class="caption">${escapeHtml(record.coordinator || "Firma del supervisor")}</p>
    </div>
  </div>
</body>
</html>`;
  }

  function documentTable(title, rows) {
    return `<h2>${escapeHtml(title)}</h2><table><tbody>${rows.map(([label, value]) => (
      `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value || "Pendiente")}</td></tr>`
    )).join("")}</tbody></table>`;
  }

  function calculateHours(start, end) {
    if (!start || !end) return null;
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    let startTotal = startHour * 60 + startMinute;
    let endTotal = endHour * 60 + endMinute;
    if (endTotal <= startTotal) endTotal += 24 * 60;
    const hours = (endTotal - startTotal) / 60;
    return hours > 24 ? null : Math.round(hours * 100) / 100;
  }

  function buildCode(value) {
    const date = value ? new Date(`${value}T00:00:00`) : new Date();
    const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
    return `HE-${stamp}-${String(draftSeed).slice(-6)}`;
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
  }

  function formatDateTime(date) {
    return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function radioValue(name) {
    const selected = form.querySelector(`[name="${name}"]:checked`);
    return selected ? selected.value : "";
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
      reader.readAsDataURL(file);
    });
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function showMessage(message, status) {
    if (!formMessage) return;
    formMessage.textContent = message;
    formMessage.classList.toggle("ok", status === "ok");
    formMessage.classList.toggle("error", status === "error");
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function fieldValue(field) {
    return field ? field.value : "";
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }
})();