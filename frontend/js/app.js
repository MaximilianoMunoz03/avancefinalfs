// URL del backend
const API_URL = "http://localhost:3000";

// Espera a que el DOM se cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    // Manejar el inicio de sesión
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token); // Guardar el token
                    window.location.href = 'index.html'; // Redirigir a la página principal
                } else {
                    const error = await response.json();
                    document.getElementById('loginError').textContent = error.error;
                }
            } catch (err) {
                document.getElementById('loginError').textContent = 'Error al conectar con el servidor.';
            }
        });
    }

    // Cargar lista de tareas
    async function loadItems() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/items`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const items = await response.json();
                const itemsList = document.getElementById('itemsList');
                itemsList.innerHTML = ''; // Limpiar lista

                items.forEach((item) => {
                    const li = document.createElement('li');
                    li.textContent = item.name;

                    // Crear el botón de eliminación (la "X")
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'X';
                    deleteButton.classList.add('delete-button');
                    deleteButton.addEventListener('click', () => {
                        deleteItem(item.id); // Llamar a la función para eliminar
                    });

                    // Añadir el botón de eliminar a la tarea
                    li.appendChild(deleteButton);
                    itemsList.appendChild(li);
                });
            } else {
                console.error('Error al cargar tareas.');
            }
        } catch (err) {
            console.error('Error de conexión:', err);
        }
    }

    // Eliminar tarea
    async function deleteItem(itemId) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                loadItems(); // Recargar la lista de tareas
            } else {
                console.error('Error al eliminar tarea.');
            }
        } catch (err) {
            console.error('Error de conexión:', err);
        }
    }

    // Agregar nueva tarea
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const token = localStorage.getItem('token');
            const newItem = document.getElementById('newItem').value;

            try {
                const response = await fetch(`${API_URL}/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name: newItem, description: '' }),
                });

                if (response.ok) {
                    document.getElementById('newItem').value = ''; // Limpiar campo
                    loadItems(); // Recargar la lista
                } else {
                    console.error('Error al agregar tarea.');
                }
            } catch (err) {
                console.error('Error de conexión:', err);
            }
        });
    }

    // Cargar tareas al cargar la página
    loadItems();
});
