(function () {
  // === URL DE TU POWER AUTOMATE (Mantiene la conexión directa) ===
  const URL_POWER_AUTOMATE = "https://default1c0051dd45964b1a9849d060735057.69.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a7c6ed1ace0a48ab8661f3569fcb0b39/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LhQoPK2FimkzlYEui44nhZoWKAflZV7ilTYPgf9W75Y";

  const listFieldNames = {
    Title: "Title",
    Codigo: "Codigo",
    ApellidosNombresCodigo: "ApellidosNombresCodigo",
    Coordinador: "Coordinador",
    DiaTrabajo: "DiaTrabajo",
    HoraInicial: "HoraInicial",
    HoraFinal: "HoraFinal",
    NumeroAnticipadoHorasExtras: "NumeroAnticipadoHorasExtras",
    HorasCalculadas: "HorasCalculadas",
    HorasExtrasRealizadasPara: "HorasExtrasRealizadasPara",
    DetalleCR60126: "DetalleCR60126",
    Maniobras: "Maniobras",
    AreasLDS: "AreasLDS",
    UbicacionGeografica: "UbicacionGeografica",
    TipoTrabajo: "TipoTrabajo",
    ModalidadDeReconocimiento: "ModalidadDeReconocimiento",
    DocumentoUrl: "DocumentoUrl",
    Estado: "Estado"
  };

  function buildListFields(record) {
    const coordinatorValue = record.coordinador || record.coordinator;
    const coordinator = findCoordinator(coordinatorValue);
    const coordinatorFinal = coordinator
      ? `${coordinator.name} - ${coordinator.code}`
      : coordinatorValue;

    return {
      codigo: record.code || "Sin codigo",
      apellidosNombresCodigo: record.employee || "Sin informacion",
      coordinador: coordinatorFinal || "Sin supervisor",
      diaDelTrabajo: record.workDate || "", 
      horaInicial: record.startTime || "",
      horaFinal: record.endTime || "",
      numeroAnticipadoHorasExtras: Number(record.expectedHours) || 0,
      horasCalculadas: Number(record.calculatedHours) || 0,
      horasExtrasRealizadasPara: record.performedFor || "No especificado",
      detalleCR60126: record.cr60126Mode || "No aplica",
      maniobras: record.dmimtArea || "No aplica",
      areasDeLDS: record.ldsArea || "No aplica",
      ubicacionGeografica: record.location || "Sin ubicacion",
      tipoDeTrabajo: record.workType || "No especificado",
      modalidadDeReconocimiento: record.paymentMode || "Pendiente",
      estado: record.coordinatorSignature ? "Firmado por supervisor" : "Pendiente de supervisor",
      
      // SOLUCIÓN AL ERROR STRING/URI: Enviamos una URL válida para que la columna tipo Link de SharePoint no falle.
      documentoHtml: "https://default1c0051dd45964b1a9849d060735057.69.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a7c6ed1ace0a48ab8661f3569fcb0b39/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LhQoPK2FimkzlYEui44nhZoWKAflZV7ilTYPgf9W75Y", 
      
      // === AQUÍ ESTÁ EL CAMBIO CLAVE ===
      // Enviamos el HTML puro en esta nueva propiedad para que Power Automate la tome en "Crear archivo"
      htmlPuro: record.documentHtml || "<html><body>Sin contenido</body></html>", 

      firmaTrabajador: record.workerSignature ? "[FIRMADO EN LOCAL]" : "",
      firmaCoordinador: record.coordinatorSignature ? "[FIRMADO EN LOCAL]" : "",
      descripcionMotivoHorasExtras: record.reason || "Sin descripción",
      describirMotivoCompensacion: record.compensationReason || "No aplica"
    };
  }

  // === ESTA FUNCIÓN HACE QUE TU PANTALLA SE LLENE Y NO SALGA "PENDIENTE" ===
  function buildContentControlValues(record) {
    return {
      FechaGeneracionDocumento: record.generatedAtFormatted || "Pendiente",
      ApellidosNombresCodigo: record.employee || "Pendiente",
      Coordinador: record.coordinator || "Pendiente",
      DiaTrabajo: record.workDateFormatted || record.workDate || "Pendiente",
      HoraInicial: record.startTime || "Pendiente",
      HoraFinal: record.endTime || "Pendiente",
      NumeroAnticipadoHorasExtras: record.expectedHours ? `${record.expectedHours} horas` : "Pendiente",
      HorasExtrasRealizadasPara: record.performedFor || "Pendiente",
      DetalleCR60126: record.cr60126Mode || "No aplica",
      Maniobras: record.dmimtArea || "No aplica",
      AreasLDS: record.ldsArea || "No aplica",
      UbicacionGeografica: record.location || "Pendiente",
      TipoTrabajo: record.workType || "Pendiente",
      DescripcionMotivoHorasExtras: record.reason || "Pendiente",
      ModalidadDeReconocimiento: record.paymentMode || "Pendiente",
      MotivoCompensacion: record.compensationReason || "No aplica",
      FirmaTrabajador: record.workerSignature ? "[FIRMADO]" : "",
      FirmaCoordinador: record.coordinatorSignature ? "[FIRMADO]" : ""
    };
  }

  function buildSharePointPackage(record) {
    return {
      listFields: buildListFields(record),
      contentControlValues: buildContentControlValues(record),
      documentFileName: `${record.code || "registro"}.html`
    };
  }

  /**
   * Envía los datos reales al flujo de Power Automate de forma directa
   */
  async function saveRecord(record) {
    const body = buildListFields(record);

    console.log("Datos antes de enviar:", record);
    console.log("Cuerpo JSON enviado:", body);

    const response = await fetch(URL_POWER_AUTOMATE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Error en flujo: ${response.status} - ${detail}`);
    }

    console.log("Datos enviados con éxito al flujo.");
    return response.status === 204 ? true : readJsonOrTrue(response);
  }

  async function readJsonOrTrue(response) {
    const text = await response.text();
    return text ? JSON.parse(text) : true;
  }

  function findCoordinator(coordinatorValue) {
    const coordinators = window.HE_CATALOGS?.coordinators;
    if (!coordinatorValue || !coordinators) return null;
    return coordinators.find((coordinator) => (
      coordinatorValue.includes(coordinator.name) ||
      coordinatorValue.includes(coordinator.code) ||
      coordinatorValue.includes(coordinator.role)
    ));
  }

  // Exportación para que app.js lea todo perfectamente
  window.SharePointAdapter = {
    listFieldNames,
    buildListFields,
    buildContentControlValues,
    buildSharePointPackage,
    saveRecord
  };
})();