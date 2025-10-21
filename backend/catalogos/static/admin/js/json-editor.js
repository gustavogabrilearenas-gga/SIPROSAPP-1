document.addEventListener('DOMContentLoaded', function() {
    // Configuración para cada tipo de editor JSON
    const schemas = {
        ingredientes: {
            fields: [
                { name: 'material_id', type: 'text', label: 'Material' },
                { name: 'cantidad', type: 'number', label: 'Cantidad' },
                { name: 'unidad', type: 'text', label: 'Unidad' }
            ]
        },
        etapas: {
            fields: [
                { name: 'etapa_id', type: 'text', label: 'Etapa' },
                { name: 'duracion_min', type: 'number', label: 'Duración (min)' },
                { name: 'descripcion', type: 'text', label: 'Descripción' }
            ]
        }
    };

    // Inicializar editores
    document.querySelectorAll('.json-editor').forEach(function(textarea) {
        initJsonEditor(textarea);
    });

    function initJsonEditor(textarea) {
        const container = document.createElement('div');
        container.className = 'json-editor-container';
        textarea.parentNode.insertBefore(container, textarea);
        textarea.classList.add('hidden-json');

        // Determinar el tipo de editor basado en el ID del campo
        const editorType = textarea.id.includes('ingredientes') ? 'ingredientes' : 'etapas';
        const schema = schemas[editorType];

        // Crear botón de agregar
        const addButton = document.createElement('button');
        addButton.textContent = `Agregar ${editorType === 'ingredientes' ? 'Ingrediente' : 'Etapa'}`;
        addButton.type = 'button';
        addButton.onclick = () => addRow(container, schema, textarea);
        container.appendChild(addButton);

        // Cargar datos existentes
        try {
            const existingData = JSON.parse(textarea.value || '[]');
            existingData.forEach(item => {
                addRow(container, schema, textarea, item);
            });
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    }

    function addRow(container, schema, textarea, data = null) {
        const row = document.createElement('div');
        row.className = 'json-editor-row';

        // Crear campos según el schema
        schema.fields.forEach(field => {
            const input = document.createElement('input');
            input.type = field.type;
            input.placeholder = field.label;
            input.value = data ? (data[field.name] || '') : '';
            input.onchange = () => updateTextarea(container, schema, textarea);
            row.appendChild(input);
        });

        // Botón de eliminar
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Eliminar';
        removeButton.type = 'button';
        removeButton.className = 'remove';
        removeButton.onclick = () => {
            row.remove();
            updateTextarea(container, schema, textarea);
        };
        row.appendChild(removeButton);

        // Insertar fila antes del botón de agregar
        container.insertBefore(row, container.lastChild);
        updateTextarea(container, schema, textarea);
    }

    function updateTextarea(container, schema, textarea) {
        const data = [];
        container.querySelectorAll('.json-editor-row').forEach(row => {
            const item = {};
            const inputs = row.querySelectorAll('input');
            schema.fields.forEach((field, index) => {
                const value = inputs[index].value;
                if (field.type === 'number') {
                    item[field.name] = value ? parseFloat(value) : null;
                } else {
                    item[field.name] = value;
                }
            });
            data.push(item);
        });
        textarea.value = JSON.stringify(data, null, 2);
    }
});