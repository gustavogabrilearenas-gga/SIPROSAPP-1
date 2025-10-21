function initIngredientesWidget(widgetId) {
    const widget = document.getElementById(widgetId);
    const input = widget.nextElementSibling;
    const ingredientesList = widget.querySelector('.ingredientes-list');
    const materialIdInput = widget.querySelector('.material-id');
    const cantidadInput = widget.querySelector('.cantidad');
    const unidadInput = widget.querySelector('.unidad');
    const addButton = widget.querySelector('.add-ingrediente');

    let ingredientes = [];
    try {
        ingredientes = JSON.parse(input.value);
    } catch(e) {
        ingredientes = [];
    }

    // Renderizar ingredientes existentes
    function renderIngredientes() {
        ingredientesList.innerHTML = '';
        ingredientes.forEach((ingrediente, index) => {
            const div = document.createElement('div');
            div.className = 'ingrediente-item';
            div.innerHTML = `
                <span class="ingrediente-material-id"><strong>Material ID:</strong> ${ingrediente[0]}</span>
                <span class="ingrediente-cantidad"><strong>Cantidad:</strong> ${ingrediente[1]}</span>
                <span class="ingrediente-unidad"><strong>Unidad:</strong> ${ingrediente[2]}</span>
                <span class="ingrediente-remove" data-index="${index}">×</span>
            `;
            ingredientesList.appendChild(div);
        });

        // Actualizar el valor del textarea oculto
        input.value = JSON.stringify(ingredientes);
    }

    // Eliminar ingrediente
    ingredientesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('ingrediente-remove')) {
            const index = parseInt(e.target.dataset.index);
            ingredientes.splice(index, 1);
            renderIngredientes();
        }
    });

    // Agregar ingrediente
    addButton.addEventListener('click', () => {
        const materialId = materialIdInput.value;
        const cantidad = cantidadInput.value;
        const unidad = unidadInput.value;

        if (!materialId || !cantidad || !unidad) {
            alert('Por favor complete todos los campos');
            return;
        }

        ingredientes.push([materialId, cantidad, unidad]);

        // Limpiar campos
        materialIdInput.value = '';
        cantidadInput.value = '';
        unidadInput.value = '';

        renderIngredientes();
    });

    // Renderizar ingredientes iniciales
    renderIngredientes();
}