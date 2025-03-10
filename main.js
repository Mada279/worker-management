const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const express = require('express');

const server = express();
const port = 3000;

// خدمة الملفات الثابتة من الدليل الجذر
server.use(express.static(path.join(__dirname)));

// خدمة ملفات node_modules بشكل صريح
server.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// إضافة مسارات محددة للتأكد من الخدمة
server.use('/node_modules/jspdf', express.static(path.join(__dirname, 'node_modules/jspdf')));
server.use('/node_modules/jspdf-autotable', express.static(path.join(__dirname, 'node_modules/jspdf-autotable')));
server.use('/node_modules/chart.js', express.static(path.join(__dirname, 'node_modules/chart.js')));

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadURL(`http://localhost:${port}/index.html`).catch((err) => {
        console.error('Failed to load URL:', err);
    });

    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});