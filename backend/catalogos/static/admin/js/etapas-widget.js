function initEtapasWidget(widgetId, addUrl, listUrl) {
    const widget = document.getElementById(widgetId);
    const input = widget.nextElementSibling;
    const etapasList = widget.querySelector('.etapas-list');
    const etapaSelector = widget.querySelector('.etapa-selector');
    const duracionInput = widget.querySelector('.duracion-min');
    const descripcionInput = widget.querySelector('.descripcion');
    const addButton = widget.querySelector('.add-etapa');

    let etapas = [];
    try {
        etapas = JSON.parse(input.value);
    } catch(e) {
        etapas = [];
    }

    // Cargar las etapas disponibles
    fetch(listUrl)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const rows = doc.querySelectorAll('#result_list tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const codigo = cells[0].textContent.trim();
                    const nombre = cells[1].textContent.trim();
                    const option = document.createElement('option');
                    option.value = codigo;
                    option.textContent = `${codigo} - ${nombre}`;
                    etapaSelector.appendChild(option);
                }
            });
        });

    // Renderizar etapas existentes
    function renderEtapas() {
        etapasList.innerHTML = '';
        etapas.forEach((etapa, index) => {
            const div = document.createElement('div');
            div.className = 'etapa-item';
            div.innerHTML = `
                <span class="etapa-nombre">${etapa.etapa_id}</span>
                <span class="etapa-duracion">${etapa.duracion_min} min</span>
                <span class="etapa-descripcion">${etapa.descripcion || ''}</span>
                <span class="etapa-remove" data-index="${index}">×</span>
            `;
            etapasList.appendChild(div);
        });

        // Actualizar el valor del textarea oculto
        input.value = JSON.stringify(etapas);
    }

    // Eliminar etapa
    etapasList.addEventListener('click', (e) => {
        if (e.target.classList.contains('etapa-remove')) {
            const index = parseInt(e.target.dataset.index);
            etapas.splice(index, 1);
            renderEtapas();
        }
    });

    // Agregar etapa
    addButton.addEventListener('click', () => {
        const etapa_id = etapaSelector.value;
        const duracion_min = parseInt(duracionInput.value);
        const descripcion = descripcionInput.value;

        if (!etapa_id || isNaN(duracion_min) || duracion_min <= 0) {
            alert('Por favor complete los campos requeridos (etapa y duración)');
            return;
        }

        etapas.push({
            etapa_id,
            duracion_min,
            descripcion
        });

        // Limpiar campos
        etapaSelector.value = '';
        duracionInput.value = '';
        descripcionInput.value = '';

        renderEtapas();
    });

    // Renderizar etapas iniciales
    renderEtapas();
}