// تهيئة Firebase (استبدل بالإعدادات الخاصة بك)
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let workers = [];
let chart;

// تسجيل الدخول
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById('login').style.display = 'none';
            document.getElementById('main').style.display = 'block';
            document.getElementById('userEmail').textContent = auth.currentUser.email;
            loadData();
        })
        .catch(error => document.getElementById('loginMessage').textContent = 'خطأ: ' + error.message);
}

// تسجيل حساب جديد
function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => document.getElementById('loginMessage').textContent = 'تم إنشاء الحساب، سجل الدخول الآن')
        .catch(error => document.getElementById('loginMessage').textContent = 'خطأ: ' + error.message);
}

// تسجيل الخروج
function logout() {
    auth.signOut().then(() => {
        document.getElementById('main').style.display = 'none';
        document.getElementById('login').style.display = 'block';
    });
}

// تحميل البيانات من Firestore
function loadData() {
    const date = document.getElementById('datePicker').value;
    const tbody = document.getElementById('workersTable');
    tbody.innerHTML = '';

    db.collection('workers').get().then(snapshot => {
        workers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        workers.forEach((worker, index) => {
            const dailyWage = worker.dailyWage[date] || 0;
            const advance = worker.advance[date] || 0;
            const remaining = dailyWage - advance;

            const row = document.createElement('tr');
            row.className = worker.attendance[date] ? 'present' : 'absent';
            row.innerHTML = `
                <td>${worker.name}</td>
                <td><input type="checkbox" ${worker.attendance[date] ? 'checked' : ''} onchange="updateAttendance('${worker.id}', '${date}', this.checked)"></td>
                <td><input type="number" value="${dailyWage}" onblur="updateDailyWage('${worker.id}', '${date}', this.value)"></td>
                <td><input type="number" value="${advance}" onblur="updateAdvance('${worker.id}', '${date}', this.value)"></td>
                <td>${remaining}</td>
                <td><input type="text" value="${worker.notes[date] || ''}" onblur="updateNotes('${worker.id}', '${date}', this.value)"></td>
            `;
            tbody.appendChild(row);
        });
    });
}

function addWorker() {
    const name = prompt('أدخل اسم العامل:');
    if (name) {
        db.collection('workers').add({
            name: name,
            attendance: {},
            dailyWage: {},
            advance: {},
            notes: {}
        }).then(() => loadData());
    }
}

function updateAttendance(id, date, isPresent) {
    db.collection('workers').doc(id).update({
        [`attendance.${date}`]: isPresent
    }).then(() => loadData());
}

function updateDailyWage(id, date, value) {
    db.collection('workers').doc(id).update({
        [`dailyWage.${date}`]: parseFloat(value) || 0
    }).then(() => loadData());
}

function updateAdvance(id, date, value) {
    db.collection('workers').doc(id).update({
        [`advance.${date}`]: parseFloat(value) || 0
    }).then(() => loadData());
}

function updateNotes(id, date, note) {
    db.collection('workers').doc(id).update({
        [`notes.${date}`]: note
    }).then(() => loadData());
}

function showDashboard() {
    const date = document.getElementById('datePicker').value;
    const dashboard = document.getElementById('dashboard');
    dashboard.style.display = 'block';
    showDailyChart(); // عرض المخطط اليومي افتراضيًا
}

function showDailyChart() {
    const date = document.getElementById('datePicker').value;
    let totalPresent = 0;
    let totalDailyWages = 0;
    let totalAdvances = 0;
    let totalRemaining = 0;

    workers.forEach(worker => {
        if (worker.attendance[date]) totalPresent++;
        totalDailyWages += worker.dailyWage[date] || 0;
        totalAdvances += worker.advance[date] || 0;
        totalRemaining += (worker.dailyWage[date] || 0) - (worker.advance[date] || 0);
    });

    document.getElementById('totalPresent').textContent = totalPresent;
    document.getElementById('totalDailyWages').textContent = totalDailyWages;
    document.getElementById('totalAdvances').textContent = totalAdvances;
    document.getElementById('totalRemaining').textContent = totalRemaining;

    if (chart) chart.destroy();
    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['الحاضرون', 'اليوميات', 'السلف', 'المتبقي'],
            datasets: [{
                label: `إحصائيات يوم ${date}`,
                data: [totalPresent, totalDailyWages, totalAdvances, totalRemaining],
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#8BC34A']
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

function showWeeklyChart() {
    const selectedDate = new Date(document.getElementById('datePicker').value);
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    let presentDays = [];
    let totalDailyWages = [];
    let totalAdvances = [];
    let totalRemaining = [];
    let labels = [];

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        labels.push(dateStr);

        let present = 0;
        let wages = 0;
        let advances = 0;
        workers.forEach(worker => {
            if (worker.attendance[dateStr]) present++;
            wages += worker.dailyWage[dateStr] || 0;
            advances += worker.advance[dateStr] || 0;
        });
        presentDays.push(present);
        totalDailyWages.push(wages);
        totalAdvances.push(advances);
        totalRemaining.push(wages - advances);
    }

    if (chart) chart.destroy();
    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'الحاضرون', data: presentDays, borderColor: '#4CAF50', fill: false },
                { label: 'اليوميات', data: totalDailyWages, borderColor: '#2196F3', fill: false },
                { label: 'السلف', data: totalAdvances, borderColor: '#FF9800', fill: false },
                { label: 'المتبقي', data: totalRemaining, borderColor: '#8BC34A', fill: false }
            ]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

function generateDailyReport() {
    const date = document.getElementById('datePicker').value;
    let reportHTML = `<h3>تقرير يومي (${date})</h3><table><tr><th>الاسم</th><th>الحضور</th><th>اليومية</th><th>السلفة</th><th>المتبقي</th></tr>`;
    workers.forEach(worker => {
        const dailyWage = worker.dailyWage[date] || 0;
        const advance = worker.advance[date] || 0;
        const remaining = dailyWage - advance;
        reportHTML += `
            <tr class="${worker.attendance[date] ? 'present' : 'absent'}">
                <td>${worker.name}</td>
                <td>${worker.attendance[date] ? 'حاضر' : 'غائب'}</td>
                <td>${dailyWage}</td>
                <td>${advance}</td>
                <td>${remaining}</td>
            </tr>
        `;
    });
    reportHTML += '</table>';
    document.getElementById('report').innerHTML = reportHTML;
}

function generateWeeklyReport() {
    const selectedDate = new Date(document.getElementById('datePicker').value);
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    let reportHTML = `<h3>تقرير أسبوعي (من ${startOfWeek.toISOString().split('T')[0]})</h3>`;
    reportHTML += '<table><tr><th>الاسم</th><th>أيام الحضور</th><th>إجمالي اليوميات</th><th>إجمالي السلف</th><th>إجمالي المتبقي</th></tr>';
    workers.forEach(worker => {
        let presentDays = 0;
        let totalDailyWages = 0;
        let totalAdvances = 0;
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            if (worker.attendance[dateStr]) presentDays++;
            totalDailyWages += worker.dailyWage[dateStr] || 0;
            totalAdvances += worker.advance[dateStr] || 0;
        }
        const totalRemaining = totalDailyWages - totalAdvances;
        reportHTML += `
            <tr>
                <td>${worker.name}</td>
                <td>${presentDays}</td>
                <td>${totalDailyWages}</td>
                <td>${totalAdvances}</td>
                <td>${totalRemaining}</td>
            </tr>
        `;
    });
    reportHTML += '</table>';
    document.getElementById('report').innerHTML = reportHTML;
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('تقرير العمالية اليومية', 10, 10);
    doc.autoTable({ html: '#report table' });
    doc.save('report.pdf');
}

function exportToExcel() {
    const wb = XLSX.utils.table_to_book(document.querySelector('#report table'));
    XLSX.writeFile(wb, 'report.xlsx');
}

// تحميل البيانات عند تسجيل الدخول
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('login').style.display = 'none';
        document.getElementById('main').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('datePicker').valueAsDate = new Date();
        loadData();
    } else {
        document.getElementById('main').style.display = 'none';
        document.getElementById('login').style.display = 'block';
    }
});