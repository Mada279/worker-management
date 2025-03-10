const { ipcRenderer } = require('electron');
console.log('Renderer.js is running');

const db = require('./server.js');

let workers = [];
let chart = null;

function initializeApp() {
    try {
        console.log('Initializing app...');
        const datePicker = document.getElementById('datePicker');
        const loginDiv = document.getElementById('login');
        const loginContainer = document.querySelector('.login-container');
        
        if (loginDiv) {
            console.log('Login div found, ensuring visibility');
            loginDiv.style.display = 'block';
            console.log('Login div style set to:', loginDiv.style.display);
            if (loginContainer) {
                console.log('Login container found, ensuring visibility');
                loginContainer.style.display = 'block';
                console.log('Login container style set to:', loginContainer.style.display);
            } else {
                console.error('Login container not found');
            }
        } else {
            console.error('Login div not found');
        }

        if (datePicker) {
            console.log('Setting datePicker value');
            datePicker.valueAsDate = new Date();
            loadData();
        } else {
            console.error('datePicker element not found');
        }
    } catch (error) {
        console.error('Error in initializeApp:', error);
    }
}

function login() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (email && password) {
            document.getElementById('login').style.display = 'none';
            document.getElementById('main').style.display = 'block';
            document.getElementById('userEmail').textContent = email;
            loadData();
        } else {
            document.getElementById('loginMessage').textContent = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
        }
    } catch (error) {
        console.error('Error in login:', error);
    }
}

function register() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (email && password) {
            document.getElementById('loginMessage').textContent = 'تم إنشاء الحساب، سجل الدخول الآن';
        } else {
            document.getElementById('loginMessage').textContent = 'يرجى إدخال البريد الإلكتروني وكلمة المرور للتسجيل';
        }
    } catch (error) {
        console.error('Error in register:', error);
    }
}

function logout() {
    try {
        document.getElementById('main').style.display = 'none';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('login').style.display = 'block';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('loginMessage').textContent = '';
    } catch (error) {
        console.error('Error in logout:', error);
    }
}

function showAddWorkerDialog() {
    const dialog = document.getElementById('addWorkerDialog');
    if (dialog) {
        dialog.style.display = 'block';
    }
}

function closeAddWorkerDialog() {
    const dialog = document.getElementById('addWorkerDialog');
    if (dialog) {
        dialog.style.display = 'none';
        document.getElementById('workerNameInput').value = '';
    }
}

function confirmAddWorker() {
    try {
        const name = document.getElementById('workerNameInput').value;
        if (name) {
            const newWorker = { name: name, present: 0, dailyWage: 0, advances: 0, totalEarnings: 0 };
            db.run("INSERT INTO workers (name, present, dailyWage, advances, totalEarnings) VALUES (?, ?, ?, ?, ?)", 
                [name, newWorker.present, newWorker.dailyWage, newWorker.advances, newWorker.totalEarnings], (err) => {
                    if (err) {
                        console.error('Error adding worker:', err.message);
                    } else {
                        loadData();
                        console.log('Worker added successfully:', name);
                        closeAddWorkerDialog();
                    }
                });
        } else {
            console.log('No name entered');
        }
    } catch (error) {
        console.error('Error in confirmAddWorker:', error);
    }
}

function loadData() {
    try {
        console.log('Loading data...');
        db.all("SELECT * FROM workers", [], (err, rows) => {
            if (err) {
                console.error('Error loading data:', err.message);
            } else {
                workers = rows;
                console.log('Workers fetched:', workers);
                const tableBody = document.getElementById('workerTable');
                tableBody.innerHTML = '';
                workers.forEach(worker => {
                    const row = tableBody.insertRow();
                    row.insertCell(0).textContent = worker.name;
                    row.insertCell(1).textContent = worker.present ? 'حاضر' : 'غائب';
                    row.insertCell(2).textContent = worker.dailyWage;
                    row.insertCell(3).textContent = worker.advances;
                    row.insertCell(4).textContent = worker.totalEarnings - worker.advances;
                    row.insertCell(5).textContent = worker.dailyWage * (worker.present ? 1 : 0);
                });
                if (workers.length === 0) {
                    console.log('No workers data to display charts');
                }
            }
        });
    } catch (error) {
        console.error('Error in loadData:', error);
    }
}

function showDashboard() {
    try {
        document.getElementById('main').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    } catch (error) {
        console.error('Error in showDashboard:', error);
    }
}

function showDailyChart() {
    try {
        const ctx = document.getElementById('myChart').getContext('2d');
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: workers.map(w => w.name),
                datasets: [{
                    label: 'اليوميات',
                    data: workers.map(w => w.dailyWage || 0),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'اليوميات (جنيه)' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error in showDailyChart:', error);
    }
}

function showWeeklyChart() {
    try {
        const ctx = document.getElementById('myChart').getContext('2d');
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: workers.map(w => w.name),
                datasets: [{
                    label: 'الأرباح الأسبوعية',
                    data: workers.map(w => (w.dailyWage * 7) || 0),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'الأرباح (جنيه)' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error in showWeeklyChart:', error);
    }
}

function exportToPDF() {
    try {
        if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.autotable) {
            console.error('jsPDF or autotable is not loaded');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tableData = workers.map(worker => [
            worker.name,
            worker.present ? 'حاضر' : 'غائب',
            worker.dailyWage,
            worker.advances,
            worker.totalEarnings - worker.advances
        ]);
        doc.autoTable({
            head: [['اسم العامل', 'الحضور', 'اليومية', 'السلفة', 'المتبقي']],
            body: tableData,
            startY: 20
        });
        doc.text('تقرير العمال - التاريخ: ' + new Date().toLocaleDateString(), 10, 10);
        doc.save('workers_report.pdf');
        console.log('PDF exported successfully');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
    }
}

function exportToExcel() {
    try {
        window.exceljs.exportToExcel(workers).then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'workers_report.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
            console.log('Excel exported successfully');
        }).catch(error => {
            console.error('Error exporting to Excel:', error);
        });
    } catch (error) {
        console.error('Error in exportToExcel:', error);
    }
}

try {
    window.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded');
        setTimeout(initializeApp, 100);
    });
} catch (error) {
    console.error('Error in renderer initialization:', error);
}